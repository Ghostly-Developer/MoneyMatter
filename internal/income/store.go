// Package income owns one profile's income data: its income streams and the
// entries (payslips, or other proof-of-income documents) recorded against
// them.
//
// Unlike the master profiles.db, an income database is per profile - it
// lives at <dataDir>/profiles/<profile name>/income/income.db - so every row
// in it already belongs to the profile whose database file it is.
package income

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

// SourceType is how an income stream (or a single entry) is paid out. Both
// is only valid on a Stream (a stream can receive both account and cash
// income); a single Entry must be one or the other.
type SourceType string

const (
	SourceTypeBoth    SourceType = "both"
	SourceTypeAccount SourceType = "account"
	SourceTypeCash    SourceType = "cash"
)

func (t SourceType) validForStream() bool {
	switch t {
	case SourceTypeBoth, SourceTypeAccount, SourceTypeCash:
		return true
	default:
		return false
	}
}

func (t SourceType) validForEntry() bool {
	return t == SourceTypeAccount || t == SourceTypeCash
}

// requiresBankAccount reports whether this source type requires a bank
// account to be set (Account and Both do, Cash doesn't).
func (t SourceType) requiresBankAccount() bool {
	return t == SourceTypeAccount || t == SourceTypeBoth
}

// TaxStatus is whether an income stream (or a single entry) is taxed. Both
// is only valid on a Stream; a single Entry must be one or the other.
type TaxStatus string

const (
	TaxStatusBoth     TaxStatus = "both"
	TaxStatusTaxed    TaxStatus = "taxed"
	TaxStatusNonTaxed TaxStatus = "non_taxed"
)

func (t TaxStatus) validForStream() bool {
	switch t {
	case TaxStatusBoth, TaxStatusTaxed, TaxStatusNonTaxed:
		return true
	default:
		return false
	}
}

func (t TaxStatus) validForEntry() bool {
	return t == TaxStatusTaxed || t == TaxStatusNonTaxed
}

// Stream is one income stream (salary, freelance, dividends, ...) belonging
// to a profile. ID is the primary key and is the foreign key an Entry uses
// (IncomeStreamID) to reference its stream; Name is a separate required,
// unique, human-facing label and is what a stream's on-disk document
// directory (<profile>/income/<Name>) is named after.
type Stream struct {
	ID          string     `json:"id"`
	ProfileID   string     `json:"profileId"`
	Name        string     `json:"name"`
	SourceType  SourceType `json:"sourceType"`
	TaxStatus   TaxStatus  `json:"taxStatus"`
	BankAccount string     `json:"bankAccount"`
	LastUpdated time.Time  `json:"lastUpdated"`
}

// Entry is one recorded income entry (a payslip, or other proof-of-income
// document) against an income stream. MonthYear is the pay period and is
// what every date-based filter/sort operates on; Day is just the optional
// day-of-month within that period and is never itself filtered on. Amount
// must be greater than zero. TaxAmount and Deductions are optional decimals
// (TaxAmount only meaningful when TaxStatus is Taxed) and are not enforced
// at the store layer, since not every caller (e.g. existing test fixtures)
// sets them.
type Entry struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	IncomeStreamID string     `json:"incomeStreamId"`
	MonthYear      string     `json:"monthYear"` // "MM/YY", required
	Day            string     `json:"day"`       // "DD", optional
	SourceType     SourceType `json:"sourceType"`
	TaxStatus      TaxStatus  `json:"taxStatus"`
	BankAccount    string     `json:"bankAccount"`
	Amount         float64    `json:"amount"` // required, must be > 0
	TaxAmount      float64    `json:"taxAmount"`
	Deductions     float64    `json:"deductions"`
	Directories    []string   `json:"directories"`
	LastUpdated    time.Time  `json:"lastUpdated"`
}

// ErrStreamNameTaken is returned when an income stream name collides with
// another stream's name in the same profile's database.
var ErrStreamNameTaken = errors.New("income stream name already in use")

// ErrStreamNotFound is returned when no income stream with the given id
// exists.
var ErrStreamNotFound = errors.New("income stream not found")

// ErrEntryNameTaken is returned when an income entry name collides with
// another entry's name in the same profile's database.
var ErrEntryNameTaken = errors.New("income entry name already in use")

// ErrEntryNotFound is returned when no income entry with the given id
// exists.
var ErrEntryNotFound = errors.New("income entry not found")

// Store owns one profile's income.db.
type Store struct {
	db *sql.DB
}

// Open opens (creating if needed) an income database at dbPath and migrates
// its schema. dbPath is <dataDir>/profiles/<name>/income/income.db for a
// given profile.
func Open(dbPath string) (*Store, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open income db: %w", err)
	}
	// modernc.org/sqlite doesn't support concurrent writers on one *sql.DB.
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		db.Close()
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate() error {
	// Defensive: rename a profile's income database created before Payslip
	// was renamed to Entry - the on-disk table was `payslips`, and is now
	// `income_entries`. A no-op once already renamed (including a brand-new
	// database, which never had a `payslips` table to begin with).
	if err := s.renameLegacyPayslipsTable(); err != nil {
		return err
	}

	const schema = `
CREATE TABLE IF NOT EXISTS income_streams (
	id            TEXT PRIMARY KEY NOT NULL,
	profile_id    TEXT NOT NULL,
	name          TEXT NOT NULL UNIQUE,
	source_type   TEXT NOT NULL,
	tax_status    TEXT NOT NULL,
	bank_account  TEXT,
	last_updated  TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS income_entries (
	id                 TEXT PRIMARY KEY NOT NULL,
	name               TEXT NOT NULL UNIQUE,
	income_stream_id   TEXT NOT NULL REFERENCES income_streams(id),
	month_year         TEXT NOT NULL,
	day                TEXT,
	source_type        TEXT NOT NULL,
	tax_status         TEXT NOT NULL,
	bank_account       TEXT,
	amount             REAL,
	tax_amount         REAL,
	deductions         REAL,
	directories        TEXT,
	last_updated       TIMESTAMP NOT NULL
);`
	if _, err := s.db.Exec(schema); err != nil {
		return fmt.Errorf("migrate income schema: %w", err)
	}
	// Defensive: add columns missing from a table created before the old
	// single Date field was split into Day (optional) + MonthYear
	// (required). Ignored once a column is already there.
	if _, err := s.db.Exec(`ALTER TABLE income_entries ADD COLUMN month_year TEXT`); err != nil {
		if !strings.Contains(err.Error(), "duplicate column") {
			return fmt.Errorf("migrate month_year column: %w", err)
		}
	}
	if _, err := s.db.Exec(`ALTER TABLE income_entries ADD COLUMN day TEXT`); err != nil {
		if !strings.Contains(err.Error(), "duplicate column") {
			return fmt.Errorf("migrate day column: %w", err)
		}
	}
	// Defensive: add the Amount/TaxAmount/Deductions decimal columns to a
	// table created before they existed. Ignored once a column is already
	// there.
	for _, col := range []string{"amount", "tax_amount", "deductions"} {
		if _, err := s.db.Exec(`ALTER TABLE income_entries ADD COLUMN ` + col + ` REAL`); err != nil {
			if !strings.Contains(err.Error(), "duplicate column") {
				return fmt.Errorf("migrate %s column: %w", col, err)
			}
		}
	}
	return s.dropLegacyDateColumn()
}

// renameLegacyPayslipsTable renames a profile's pre-existing `payslips`
// table (from before Payslip was renamed to Entry) to `income_entries`, so
// existing installs keep their data under the new name instead of silently
// starting a second, empty table. A no-op once already renamed, or for a
// brand-new database that never had a `payslips` table.
func (s *Store) renameLegacyPayslipsTable() error {
	var count int
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'payslips'`).Scan(&count); err != nil {
		return fmt.Errorf("check for legacy payslips table: %w", err)
	}
	if count == 0 {
		return nil
	}
	if _, err := s.db.Exec(`ALTER TABLE payslips RENAME TO income_entries`); err != nil {
		return fmt.Errorf("rename legacy payslips table: %w", err)
	}
	return nil
}

// dropLegacyDateColumn removes the original `date TEXT NOT NULL` column from
// an income_entries table created before Date was split into MonthYear +
// Day. That split only ever added the new columns (ALTER TABLE ... ADD
// COLUMN, above); the old NOT NULL column was left in place unused, which
// blocks every insert going forward since the current INSERT statement
// never sets it. SQLite can't drop a NOT NULL constraint via ALTER TABLE, so
// this rebuilds the table without it, following SQLite's documented
// table-recreation procedure. A no-op once the column is gone.
func (s *Store) dropLegacyDateColumn() error {
	hasDate, err := s.columnExists("income_entries", "date")
	if err != nil {
		return fmt.Errorf("check for legacy date column: %w", err)
	}
	if !hasDate {
		return nil
	}

	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin legacy date column migration: %w", err)
	}
	defer tx.Rollback()

	const rebuild = `
CREATE TABLE income_entries_new (
	id                 TEXT PRIMARY KEY NOT NULL,
	name               TEXT NOT NULL UNIQUE,
	income_stream_id   TEXT NOT NULL REFERENCES income_streams(id),
	month_year         TEXT,
	day                TEXT,
	source_type        TEXT NOT NULL,
	tax_status         TEXT NOT NULL,
	bank_account       TEXT,
	amount             REAL,
	tax_amount         REAL,
	deductions         REAL,
	directories        TEXT,
	last_updated       TIMESTAMP NOT NULL
);
INSERT INTO income_entries_new (id, name, income_stream_id, month_year, day, source_type, tax_status, bank_account, amount, tax_amount, deductions, directories, last_updated)
	SELECT id, name, income_stream_id, COALESCE(NULLIF(month_year, ''), date), day, source_type, tax_status, bank_account, amount, tax_amount, deductions, directories, last_updated FROM income_entries;
DROP TABLE income_entries;
ALTER TABLE income_entries_new RENAME TO income_entries;`
	if _, err := tx.Exec(rebuild); err != nil {
		return fmt.Errorf("drop legacy date column: %w", err)
	}
	return tx.Commit()
}

func (s *Store) columnExists(table, column string) (bool, error) {
	rows, err := s.db.Query(`PRAGMA table_info(` + table + `)`)
	if err != nil {
		return false, err
	}
	defer rows.Close()
	for rows.Next() {
		var (
			cid, notNull, pk int
			name, ctype      string
			dflt             sql.NullString
		)
		if err := rows.Scan(&cid, &name, &ctype, &notNull, &dflt, &pk); err != nil {
			return false, err
		}
		if name == column {
			return true, nil
		}
	}
	return false, rows.Err()
}

// CreateStream generates a new stream id and inserts the stream. Any id set
// on st is ignored - the id is always generated here. Returns
// ErrStreamNameTaken if the name is already used, and an error if
// BankAccount is empty while SourceType requires one (Account or Both).
func (s *Store) CreateStream(st Stream) (Stream, error) {
	if err := validateStream(st); err != nil {
		return Stream{}, err
	}
	st.ID = uuid.NewString()
	st.LastUpdated = time.Now().UTC()

	_, err := s.db.Exec(
		`INSERT INTO income_streams (id, profile_id, name, source_type, tax_status, bank_account, last_updated)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		st.ID, st.ProfileID, st.Name, string(st.SourceType), string(st.TaxStatus), nullableString(st.BankAccount), st.LastUpdated,
	)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return Stream{}, ErrStreamNameTaken
		}
		return Stream{}, fmt.Errorf("insert income stream: %w", err)
	}
	return st, nil
}

// UpdateStream overwrites an existing stream's fields, looked up and
// identified by ID - Name is intentionally excluded from the update (stays
// whatever it was created with), since it's what the stream's on-disk
// document directory is named after. Bumps LastUpdated to now.
func (s *Store) UpdateStream(st Stream) (Stream, error) {
	if st.ID == "" {
		return Stream{}, errors.New("income stream id is required")
	}
	if !st.SourceType.validForStream() {
		return Stream{}, fmt.Errorf("invalid source type %q", st.SourceType)
	}
	if !st.TaxStatus.validForStream() {
		return Stream{}, fmt.Errorf("invalid tax status %q", st.TaxStatus)
	}
	if st.SourceType.requiresBankAccount() && strings.TrimSpace(st.BankAccount) == "" {
		return Stream{}, fmt.Errorf("bank account is required for source type %q", st.SourceType)
	}
	st.LastUpdated = time.Now().UTC()

	res, err := s.db.Exec(
		`UPDATE income_streams SET source_type = ?, tax_status = ?, bank_account = ?, last_updated = ?
		 WHERE id = ?`,
		string(st.SourceType), string(st.TaxStatus), nullableString(st.BankAccount), st.LastUpdated, st.ID,
	)
	if err != nil {
		return Stream{}, fmt.Errorf("update income stream: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return Stream{}, err
	}
	if n == 0 {
		return Stream{}, ErrStreamNotFound
	}
	return s.GetStream(st.ID)
}

// RenameStream changes a stream's name, looked up by ID. This only updates
// the database row - Name changes also require repositioning the stream's
// on-disk document directory (<profile>/income/<name>), which the caller
// (App.UpdateIncomeStream) is responsible for since this package has no
// access to the profile's income docs directory.
func (s *Store) RenameStream(id, newName string) (Stream, error) {
	newName = strings.TrimSpace(newName)
	if newName == "" {
		return Stream{}, errors.New("income stream name is required")
	}
	res, err := s.db.Exec(
		`UPDATE income_streams SET name = ?, last_updated = ? WHERE id = ?`,
		newName, time.Now().UTC(), id,
	)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return Stream{}, ErrStreamNameTaken
		}
		return Stream{}, fmt.Errorf("rename income stream: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return Stream{}, err
	}
	if n == 0 {
		return Stream{}, ErrStreamNotFound
	}
	return s.GetStream(id)
}

// DeleteStream removes an income stream and every entry recorded against it
// - entries are deleted first since the income_entries table has a foreign
// key on income_stream_id. Any attachment files under the stream's
// directories are the caller's (App's) responsibility, matching
// DeleteEntry.
func (s *Store) DeleteStream(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM income_entries WHERE income_stream_id = ?`, id); err != nil {
		return fmt.Errorf("delete stream entries: %w", err)
	}
	res, err := tx.Exec(`DELETE FROM income_streams WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete income stream: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrStreamNotFound
	}
	return tx.Commit()
}

// GetStream fetches a single income stream by id.
func (s *Store) GetStream(id string) (Stream, error) {
	row := s.db.QueryRow(
		`SELECT id, profile_id, name, source_type, tax_status, bank_account, last_updated FROM income_streams WHERE id = ?`,
		id,
	)
	return scanStream(row)
}

// ListStreams returns every income stream in this profile's database.
func (s *Store) ListStreams() ([]Stream, error) {
	rows, err := s.db.Query(
		`SELECT id, profile_id, name, source_type, tax_status, bank_account, last_updated FROM income_streams ORDER BY rowid`,
	)
	if err != nil {
		return nil, fmt.Errorf("list income streams: %w", err)
	}
	defer rows.Close()

	var out []Stream
	for rows.Next() {
		st, err := scanStream(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

// CreateEntry generates a new entry id and inserts the entry against an
// existing stream (IncomeStreamID must already exist). Returns
// ErrEntryNameTaken if the name is already used, and an error if
// BankAccount is empty while SourceType is Account, if MonthYear isn't
// MM/YY, if a non-empty Day isn't DD, or if Amount isn't greater than zero.
func (s *Store) CreateEntry(e Entry) (Entry, error) {
	if err := validateEntry(e); err != nil {
		return Entry{}, err
	}
	if _, err := s.GetStream(e.IncomeStreamID); err != nil {
		return Entry{}, err
	}

	e.ID = uuid.NewString()
	e.LastUpdated = time.Now().UTC()
	directories, err := encodeDirectories(e.Directories)
	if err != nil {
		return Entry{}, err
	}

	_, err = s.db.Exec(
		`INSERT INTO income_entries (id, name, income_stream_id, month_year, day, source_type, tax_status, bank_account, amount, tax_amount, deductions, directories, last_updated)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		e.ID, e.Name, e.IncomeStreamID, e.MonthYear, nullableString(e.Day), string(e.SourceType), string(e.TaxStatus), nullableString(e.BankAccount), e.Amount, e.TaxAmount, e.Deductions, directories, e.LastUpdated,
	)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return Entry{}, ErrEntryNameTaken
		}
		return Entry{}, fmt.Errorf("insert income entry: %w", err)
	}
	return e, nil
}

// UpdateEntry overwrites an existing entry's fields, looked up and
// identified by ID. Bumps LastUpdated to now.
func (s *Store) UpdateEntry(e Entry) (Entry, error) {
	if e.ID == "" {
		return Entry{}, errors.New("income entry id is required")
	}
	if err := validateEntry(e); err != nil {
		return Entry{}, err
	}
	if _, err := s.GetStream(e.IncomeStreamID); err != nil {
		return Entry{}, err
	}
	e.LastUpdated = time.Now().UTC()
	directories, err := encodeDirectories(e.Directories)
	if err != nil {
		return Entry{}, err
	}

	res, err := s.db.Exec(
		`UPDATE income_entries SET name = ?, income_stream_id = ?, month_year = ?, day = ?, source_type = ?, tax_status = ?, bank_account = ?, amount = ?, tax_amount = ?, deductions = ?, directories = ?, last_updated = ?
		 WHERE id = ?`,
		e.Name, e.IncomeStreamID, e.MonthYear, nullableString(e.Day), string(e.SourceType), string(e.TaxStatus), nullableString(e.BankAccount), e.Amount, e.TaxAmount, e.Deductions, directories, e.LastUpdated, e.ID,
	)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return Entry{}, ErrEntryNameTaken
		}
		return Entry{}, fmt.Errorf("update income entry: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return Entry{}, err
	}
	if n == 0 {
		return Entry{}, ErrEntryNotFound
	}
	return s.GetEntry(e.ID)
}

// GetEntry fetches a single income entry by id.
func (s *Store) GetEntry(id string) (Entry, error) {
	row := s.db.QueryRow(
		`SELECT id, name, income_stream_id, month_year, day, source_type, tax_status, bank_account, amount, tax_amount, deductions, directories, last_updated FROM income_entries WHERE id = ?`,
		id,
	)
	return scanEntry(row)
}

// DeleteEntry removes an income entry by id. It only touches the database
// row - removing any attached files under the stream's document directory
// is the caller's (App's) responsibility, since this package doesn't
// otherwise perform file I/O against Directories paths.
func (s *Store) DeleteEntry(id string) error {
	res, err := s.db.Exec(`DELETE FROM income_entries WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete income entry: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrEntryNotFound
	}
	return nil
}

// ListEntries returns every income entry in this profile's database,
// optionally filtered to a single stream when incomeStreamID is non-empty
// and/or to a single pay period when monthYear ("MM/YY") is non-empty. Day
// is never filtered on - MonthYear is the only date-based filter, since Day
// is optional and may not be set on every entry.
func (s *Store) ListEntries(incomeStreamID, monthYear string) ([]Entry, error) {
	query := `SELECT id, name, income_stream_id, month_year, day, source_type, tax_status, bank_account, amount, tax_amount, deductions, directories, last_updated FROM income_entries`
	var (
		clauses []string
		args    []any
	)
	if incomeStreamID != "" {
		clauses = append(clauses, `income_stream_id = ?`)
		args = append(args, incomeStreamID)
	}
	if monthYear != "" {
		clauses = append(clauses, `month_year = ?`)
		args = append(args, monthYear)
	}
	if len(clauses) > 0 {
		query += ` WHERE ` + strings.Join(clauses, ` AND `)
	}
	query += ` ORDER BY rowid DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("list income entries: %w", err)
	}
	defer rows.Close()

	var out []Entry
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func validateStream(st Stream) error {
	if st.Name == "" {
		return errors.New("income stream name is required")
	}
	if st.ProfileID == "" {
		return errors.New("income stream profile id is required")
	}
	if !st.SourceType.validForStream() {
		return fmt.Errorf("invalid source type %q", st.SourceType)
	}
	if !st.TaxStatus.validForStream() {
		return fmt.Errorf("invalid tax status %q", st.TaxStatus)
	}
	if st.SourceType.requiresBankAccount() && strings.TrimSpace(st.BankAccount) == "" {
		return fmt.Errorf("bank account is required for source type %q", st.SourceType)
	}
	return nil
}

func validateEntry(e Entry) error {
	if e.Name == "" {
		return errors.New("income entry name is required")
	}
	if e.IncomeStreamID == "" {
		return errors.New("income entry stream id is required")
	}
	if !e.SourceType.validForEntry() {
		return fmt.Errorf("invalid source type %q", e.SourceType)
	}
	if !e.TaxStatus.validForEntry() {
		return fmt.Errorf("invalid tax status %q", e.TaxStatus)
	}
	if e.SourceType.requiresBankAccount() && strings.TrimSpace(e.BankAccount) == "" {
		return fmt.Errorf("bank account is required for source type %q", e.SourceType)
	}
	if e.Amount <= 0 {
		return errors.New("income entry amount must be greater than zero")
	}
	if err := validateMonthYear(e.MonthYear); err != nil {
		return err
	}
	if e.Day != "" {
		return validateDay(e.Day)
	}
	return nil
}

// monthYearRe matches "MM/YY", required on every Entry and the only field
// date-based filtering/sorting uses; dayRe matches "DD", the format of an
// Entry's optional Day (the day-of-month within that MonthYear).
var (
	monthYearRe = regexp.MustCompile(`^(\d{2})/(\d{2})$`)
	dayRe       = regexp.MustCompile(`^(\d{2})$`)
)

func validateMonthYear(monthYear string) error {
	m := monthYearRe.FindStringSubmatch(monthYear)
	if m == nil {
		return fmt.Errorf("month/year %q must be MM/YY", monthYear)
	}
	month, _ := strconv.Atoi(m[1])
	if month < 1 || month > 12 {
		return fmt.Errorf("invalid month in %q", monthYear)
	}
	return nil
}

func validateDay(dayStr string) error {
	m := dayRe.FindStringSubmatch(dayStr)
	if m == nil {
		return fmt.Errorf("day %q must be DD", dayStr)
	}
	day, _ := strconv.Atoi(m[1])
	if day < 1 || day > 31 {
		return fmt.Errorf("invalid day %q", dayStr)
	}
	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanStream(row rowScanner) (Stream, error) {
	var (
		st          Stream
		sourceType  string
		taxStatus   string
		bankAccount sql.NullString
	)
	err := row.Scan(&st.ID, &st.ProfileID, &st.Name, &sourceType, &taxStatus, &bankAccount, &st.LastUpdated)
	if errors.Is(err, sql.ErrNoRows) {
		return Stream{}, ErrStreamNotFound
	}
	if err != nil {
		return Stream{}, fmt.Errorf("scan income stream: %w", err)
	}
	st.SourceType = SourceType(sourceType)
	st.TaxStatus = TaxStatus(taxStatus)
	st.BankAccount = bankAccount.String
	return st, nil
}

func scanEntry(row rowScanner) (Entry, error) {
	var (
		e           Entry
		day         sql.NullString
		sourceType  string
		taxStatus   string
		bankAccount sql.NullString
		amount      sql.NullFloat64
		taxAmount   sql.NullFloat64
		deductions  sql.NullFloat64
		directories sql.NullString
	)
	err := row.Scan(&e.ID, &e.Name, &e.IncomeStreamID, &e.MonthYear, &day, &sourceType, &taxStatus, &bankAccount, &amount, &taxAmount, &deductions, &directories, &e.LastUpdated)
	if errors.Is(err, sql.ErrNoRows) {
		return Entry{}, ErrEntryNotFound
	}
	if err != nil {
		return Entry{}, fmt.Errorf("scan income entry: %w", err)
	}
	e.Day = day.String
	e.SourceType = SourceType(sourceType)
	e.TaxStatus = TaxStatus(taxStatus)
	e.BankAccount = bankAccount.String
	e.Amount = amount.Float64
	e.TaxAmount = taxAmount.Float64
	e.Deductions = deductions.Float64
	e.Directories, err = decodeDirectories(directories)
	if err != nil {
		return Entry{}, err
	}
	return e, nil
}

func encodeDirectories(d []string) (sql.NullString, error) {
	if d == nil {
		return sql.NullString{}, nil
	}
	b, err := json.Marshal(d)
	if err != nil {
		return sql.NullString{}, err
	}
	return sql.NullString{String: string(b), Valid: true}, nil
}

func decodeDirectories(d sql.NullString) ([]string, error) {
	if !d.Valid || d.String == "" {
		return nil, nil
	}
	var out []string
	if err := json.Unmarshal([]byte(d.String), &out); err != nil {
		return nil, err
	}
	return out, nil
}

func nullableString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func isUniqueConstraintErr(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed")
}
