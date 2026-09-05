package profile

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

// GuestProfileID is the fixed id of the profile every fresh install is
// seeded with, so the app always has at least one usable profile.
const GuestProfileID = "guest"

// Profile mirrors the `profiles` table in the master profile database.
// Id is the primary key here and is the foreign key every per-profile
// database (income, under <profile>/income; expense/investment/taxes, under
// <profile>/db, once built) uses to scope its own rows back to this profile.
//
// Name is unique and doubles as the profile's on-disk directory name
// (<dataDir>/profiles/<name>) - use RenameProfile to change it, since a
// plain Update would leave the directory out of sync.
//
// Only one profile at a time can have IsAdmin set; the first profile ever
// created (the seeded guest profile) starts out as admin.
type Profile struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Color         string   `json:"color"`
	Currency      string   `json:"currency"`
	BaseTheme     string   `json:"baseTheme"`
	ThemeColor    string   `json:"themeColor"`
	IsAdmin       bool     `json:"isAdmin"`
	Notifications []string `json:"notifications"`
}

// Store owns the master profile database (<dataDir>/profiles.db) and the
// on-disk directory structure for every profile it knows about.
type Store struct {
	db      *sql.DB
	dataDir string
}

// Open opens (creating if needed) the master profile database inside
// dataDir, migrates its schema, and makes sure the guest profile - and its
// on-disk folder structure - exists.
func Open(dataDir string) (*Store, error) {
	dbPath := filepath.Join(dataDir, "profiles.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open profiles db: %w", err)
	}
	// modernc.org/sqlite doesn't support concurrent writers on one *sql.DB.
	db.SetMaxOpenConns(1)

	s := &Store{db: db, dataDir: dataDir}
	if err := s.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	if err := s.ensureGuestProfile(); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate() error {
	const schema = `
CREATE TABLE IF NOT EXISTS profiles (
	id             TEXT PRIMARY KEY NOT NULL,
	name           TEXT NOT NULL UNIQUE,
	color          TEXT,
	currency       TEXT,
	base_theme     TEXT,
	theme_color    TEXT,
	is_admin       INTEGER DEFAULT 0,
	notifications  TEXT
);`
	if _, err := s.db.Exec(schema); err != nil {
		return fmt.Errorf("migrate profiles table: %w", err)
	}
	// Defensive: add is_admin if it's missing from a table created before
	// this column existed. Ignored once the column is already there.
	if _, err := s.db.Exec(`ALTER TABLE profiles ADD COLUMN is_admin INTEGER DEFAULT 0`); err != nil {
		if !strings.Contains(err.Error(), "duplicate column") {
			return fmt.Errorf("migrate is_admin column: %w", err)
		}
	}
	return nil
}

func (s *Store) ensureGuestProfile() error {
	existing, err := s.Get(GuestProfileID)
	if err == nil {
		return EnsureProfileDirs(s.dataDir, existing.Name)
	}
	if !errors.Is(err, ErrProfileNotFound) {
		return err
	}
	guest := Profile{
		ID:      GuestProfileID,
		Name:    "Guest",
		IsAdmin: true,
	}
	return s.insert(guest)
}

// ErrProfileNotFound is returned when no profile with the given id exists.
var ErrProfileNotFound = errors.New("profile not found")

// ErrProfileNameTaken is returned when a profile name collides with another
// profile's name - names are unique and double as the profile's on-disk
// directory name.
var ErrProfileNameTaken = errors.New("profile name already in use")

func encodeNotifications(n []string) (sql.NullString, error) {
	if n == nil {
		return sql.NullString{}, nil
	}
	b, err := json.Marshal(n)
	if err != nil {
		return sql.NullString{}, err
	}
	return sql.NullString{String: string(b), Valid: true}, nil
}

func decodeNotifications(n sql.NullString) ([]string, error) {
	if !n.Valid || n.String == "" {
		return nil, nil
	}
	var out []string
	if err := json.Unmarshal([]byte(n.String), &out); err != nil {
		return nil, err
	}
	return out, nil
}

// Create generates a new profile id, inserts the profile, and creates its
// on-disk folder structure (<dataDir>/profiles/<name>/{db,income,expense,investment,taxes}).
// Any id set on p is ignored - the id is always generated here, never taken
// from the caller/UI. If p.IsAdmin is true, every other profile's admin
// flag is cleared first, since only one profile can be admin at a time.
func (s *Store) Create(p Profile) (Profile, error) {
	p.ID = uuid.NewString()
	if err := s.insert(p); err != nil {
		return Profile{}, err
	}
	return p, nil
}

// insert writes a profile under its already-assigned id and creates its
// on-disk folder structure. Used by Create (generated id) and
// ensureGuestProfile (fixed GuestProfileID).
func (s *Store) insert(p Profile) error {
	if p.ID == "" {
		return errors.New("profile id is required")
	}
	if p.Name == "" {
		return errors.New("profile name is required")
	}
	notifications, err := encodeNotifications(p.Notifications)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if p.IsAdmin {
		if _, err := tx.Exec(`UPDATE profiles SET is_admin = 0`); err != nil {
			return fmt.Errorf("clear existing admin: %w", err)
		}
	}

	_, err = tx.Exec(
		`INSERT INTO profiles (id, name, color, currency, base_theme, theme_color, is_admin, notifications)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.Name, nullableString(p.Color), nullableString(p.Currency),
		nullableString(p.BaseTheme), nullableString(p.ThemeColor), boolToInt(p.IsAdmin), notifications,
	)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return ErrProfileNameTaken
		}
		return fmt.Errorf("insert profile: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit profile insert: %w", err)
	}

	if err := EnsureProfileDirs(s.dataDir, p.Name); err != nil {
		return fmt.Errorf("create profile dirs: %w", err)
	}
	return nil
}

// Update overwrites an existing profile's fields, except its name - use
// RenameProfile to change the name, since that also has to rename the
// profile's on-disk directory. If p.IsAdmin is true, every other profile's
// admin flag is cleared first, since only one profile can be admin at a
// time.
func (s *Store) Update(p Profile) error {
	if p.ID == "" {
		return errors.New("profile id is required")
	}
	notifications, err := encodeNotifications(p.Notifications)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if p.IsAdmin {
		if _, err := tx.Exec(`UPDATE profiles SET is_admin = 0 WHERE id != ?`, p.ID); err != nil {
			return fmt.Errorf("clear existing admin: %w", err)
		}
	}

	res, err := tx.Exec(
		`UPDATE profiles SET color = ?, currency = ?, base_theme = ?, theme_color = ?, is_admin = ?, notifications = ?
		 WHERE id = ?`,
		nullableString(p.Color), nullableString(p.Currency),
		nullableString(p.BaseTheme), nullableString(p.ThemeColor), boolToInt(p.IsAdmin), notifications, p.ID,
	)
	if err != nil {
		return fmt.Errorf("update profile: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrProfileNotFound
	}

	return tx.Commit()
}

// RenameProfile changes a profile's name and renames its on-disk directory
// (<dataDir>/profiles/<name>) to match. This is the only way to change a
// profile's name.
func (s *Store) RenameProfile(id, newName string) (Profile, error) {
	newName = strings.TrimSpace(newName)
	if newName == "" {
		return Profile{}, errors.New("profile name is required")
	}

	current, err := s.Get(id)
	if err != nil {
		return Profile{}, err
	}
	if current.Name == newName {
		return current, nil
	}

	oldDir := profileDir(s.dataDir, current.Name)
	newDir := profileDir(s.dataDir, newName)

	res, err := s.db.Exec(`UPDATE profiles SET name = ? WHERE id = ?`, newName, id)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return Profile{}, ErrProfileNameTaken
		}
		return Profile{}, fmt.Errorf("rename profile: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return Profile{}, err
	}
	if n == 0 {
		return Profile{}, ErrProfileNotFound
	}

	if _, statErr := os.Stat(oldDir); statErr == nil {
		if err := os.Rename(oldDir, newDir); err != nil {
			// Best-effort rollback so the db and disk don't disagree on the name.
			s.db.Exec(`UPDATE profiles SET name = ? WHERE id = ?`, current.Name, id)
			return Profile{}, fmt.Errorf("rename profile directory: %w", err)
		}
	} else if err := EnsureProfileDirs(s.dataDir, newName); err != nil {
		return Profile{}, fmt.Errorf("create renamed profile dirs: %w", err)
	}

	current.Name = newName
	return current, nil
}

// ErrCannotDeleteGuestProfile is returned when deleting the seeded guest
// profile is attempted - the app always needs it as a guaranteed fallback.
var ErrCannotDeleteGuestProfile = errors.New("cannot delete the guest profile")

// ErrCannotDeleteLastProfile is returned when deleting the only remaining
// profile is attempted - the app always needs at least one usable profile.
var ErrCannotDeleteLastProfile = errors.New("cannot delete the only profile")

// Delete removes a profile and its on-disk directory
// (<dataDir>/profiles/<name>). Deleting the seeded guest profile or the last
// remaining profile is refused. If the deleted profile was admin, the guest
// profile is promoted to admin so exactly one profile stays admin.
func (s *Store) Delete(id string) error {
	if id == GuestProfileID {
		return ErrCannotDeleteGuestProfile
	}

	p, err := s.Get(id)
	if err != nil {
		return err
	}

	var count int
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM profiles`).Scan(&count); err != nil {
		return fmt.Errorf("count profiles: %w", err)
	}
	if count <= 1 {
		return ErrCannotDeleteLastProfile
	}

	res, err := s.db.Exec(`DELETE FROM profiles WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete profile: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrProfileNotFound
	}

	if p.IsAdmin {
		if _, err := s.db.Exec(`UPDATE profiles SET is_admin = 1 WHERE id = ?`, GuestProfileID); err != nil {
			return fmt.Errorf("promote guest profile to admin: %w", err)
		}
	}

	dir := profileDir(s.dataDir, p.Name)
	if err := os.RemoveAll(dir); err != nil {
		return fmt.Errorf("remove profile directory: %w", err)
	}
	return nil
}

// Get fetches a single profile by id.
func (s *Store) Get(id string) (Profile, error) {
	row := s.db.QueryRow(
		`SELECT id, name, color, currency, base_theme, theme_color, is_admin, notifications FROM profiles WHERE id = ?`,
		id,
	)
	return scanProfile(row)
}

// DBDir returns the <dataDir>/profiles/<name>/db directory for the given
// profile id - where this profile's own per-area SQLite databases (income,
// expense, investment, taxes) live.
func (s *Store) DBDir(id string) (string, error) {
	p, err := s.Get(id)
	if err != nil {
		return "", err
	}
	return filepath.Join(profileDir(s.dataDir, p.Name), "db"), nil
}

// IncomeDocsDir returns the <dataDir>/profiles/<name>/income directory for
// the given profile id - where uploaded payslip/proof-of-income documents
// are stored, one subdirectory per income stream.
func (s *Store) IncomeDocsDir(id string) (string, error) {
	p, err := s.Get(id)
	if err != nil {
		return "", err
	}
	return filepath.Join(profileDir(s.dataDir, p.Name), "income"), nil
}

// List returns every known profile.
func (s *Store) List() ([]Profile, error) {
	rows, err := s.db.Query(
		`SELECT id, name, color, currency, base_theme, theme_color, is_admin, notifications FROM profiles ORDER BY rowid`,
	)
	if err != nil {
		return nil, fmt.Errorf("list profiles: %w", err)
	}
	defer rows.Close()

	var out []Profile
	for rows.Next() {
		p, err := scanProfile(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanProfile(row rowScanner) (Profile, error) {
	var (
		p             Profile
		color         sql.NullString
		currency      sql.NullString
		baseTheme     sql.NullString
		themeColor    sql.NullString
		isAdmin       sql.NullInt64
		notifications sql.NullString
	)
	err := row.Scan(&p.ID, &p.Name, &color, &currency, &baseTheme, &themeColor, &isAdmin, &notifications)
	if errors.Is(err, sql.ErrNoRows) {
		return Profile{}, ErrProfileNotFound
	}
	if err != nil {
		return Profile{}, fmt.Errorf("scan profile: %w", err)
	}
	p.Color = color.String
	p.Currency = currency.String
	p.BaseTheme = baseTheme.String
	p.ThemeColor = themeColor.String
	p.IsAdmin = isAdmin.Valid && isAdmin.Int64 != 0
	p.Notifications, err = decodeNotifications(notifications)
	if err != nil {
		return Profile{}, err
	}
	return p, nil
}

func nullableString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func isUniqueConstraintErr(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed")
}
