package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"MoneyMatter/internal/income"
	"MoneyMatter/internal/paths"
	"MoneyMatter/internal/profile"
)

// App struct
type App struct {
	ctx     context.Context
	dataDir string
	store   *profile.Store
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dataDir, err := paths.DataDir()
	if err != nil {
		log.Printf("resolve data dir: %v", err)
		return
	}
	a.dataDir = dataDir

	s, err := profile.Open(dataDir)
	if err != nil {
		log.Printf("open profile store: %v", err)
		return
	}
	a.store = s
}

// shutdown is called when the app terminates, closing the profile database.
func (a *App) shutdown(ctx context.Context) {
	if a.store != nil {
		a.store.Close()
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// ListProfiles returns every known profile, guest included.
func (a *App) ListProfiles() ([]profile.Profile, error) {
	return a.store.List()
}

// CreateProfile inserts a new profile (the id is generated server-side, any
// id passed in from the UI is ignored) and creates its on-disk folder
// structure.
func (a *App) CreateProfile(p profile.Profile) (profile.Profile, error) {
	return a.store.Create(p)
}

// UpdateProfile overwrites an existing profile's fields (name excluded -
// use RenameProfile to change the name).
func (a *App) UpdateProfile(p profile.Profile) (profile.Profile, error) {
	if err := a.store.Update(p); err != nil {
		return profile.Profile{}, err
	}
	return a.store.Get(p.ID)
}

// RenameProfile changes a profile's name and renames its on-disk directory
// to match.
func (a *App) RenameProfile(id string, newName string) (profile.Profile, error) {
	return a.store.RenameProfile(id, newName)
}

// DeleteProfile removes a profile and its on-disk directory. Deleting the
// seeded guest profile or the only remaining profile is refused (see
// profile.Store.Delete).
func (a *App) DeleteProfile(profileID string) error {
	return a.store.Delete(profileID)
}

// ExportProfileData zips the given profile's on-disk directory (its db and
// uploaded documents) so the frontend can save it, for Settings -> Export
// Data.
func (a *App) ExportProfileData(profileID string) (profile.ProfileExport, error) {
	return a.store.ExportProfile(profileID)
}

// openIncomeStore opens (creating if needed) the given profile's own
// income.db, under its <profile>/income folder (alongside the per-stream
// document directories). Callers must Close it.
func (a *App) openIncomeStore(profileID string) (*income.Store, error) {
	incomeDir, err := a.store.IncomeDocsDir(profileID)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(incomeDir, 0o755); err != nil {
		return nil, err
	}
	dbPath := filepath.Join(incomeDir, "income.db")
	if err := a.migrateLegacyIncomeDB(profileID, dbPath); err != nil {
		return nil, err
	}
	return income.Open(dbPath)
}

// migrateLegacyIncomeDB moves an income.db found at its old location
// (<profile>/db/income.db, from before income.db moved into <profile>/income)
// to dbPath, if one exists there and nothing has been created at dbPath yet.
// A no-op for every profile created after the move.
func (a *App) migrateLegacyIncomeDB(profileID, dbPath string) error {
	if _, err := os.Stat(dbPath); err == nil {
		return nil
	}
	dbDir, err := a.store.DBDir(profileID)
	if err != nil {
		return err
	}
	legacyPath := filepath.Join(dbDir, "income.db")
	if _, err := os.Stat(legacyPath); err != nil {
		return nil
	}
	return os.Rename(legacyPath, dbPath)
}

// ListIncomeStreams returns every income stream belonging to the given
// profile.
func (a *App) ListIncomeStreams(profileID string) ([]income.Stream, error) {
	s, err := a.openIncomeStore(profileID)
	if err != nil {
		return nil, err
	}
	defer s.Close()
	return s.ListStreams()
}

// CreateIncomeStream inserts a new income stream for its profile and
// creates the stream's document directory (<profile>/income/<name>).
func (a *App) CreateIncomeStream(stream income.Stream) (income.Stream, error) {
	s, err := a.openIncomeStore(stream.ProfileID)
	if err != nil {
		return income.Stream{}, err
	}
	defer s.Close()

	created, err := s.CreateStream(stream)
	if err != nil {
		return income.Stream{}, err
	}

	incomeDir, err := a.store.IncomeDocsDir(stream.ProfileID)
	if err != nil {
		return income.Stream{}, err
	}
	if err := income.EnsureStreamDir(incomeDir, created.Name); err != nil {
		return income.Stream{}, fmt.Errorf("create income stream directory: %w", err)
	}
	return created, nil
}

// UpdateIncomeStream overwrites an existing income stream's fields (looked
// up by id). If stream.Name differs from the stored name, it's renamed
// first - both the database row and the stream's on-disk document
// directory (<profile>/income/<name>) - before the rest of the fields are
// applied via Store.UpdateStream.
func (a *App) UpdateIncomeStream(stream income.Stream) (income.Stream, error) {
	s, err := a.openIncomeStore(stream.ProfileID)
	if err != nil {
		return income.Stream{}, err
	}
	defer s.Close()

	current, err := s.GetStream(stream.ID)
	if err != nil {
		return income.Stream{}, err
	}

	newName := strings.TrimSpace(stream.Name)
	if newName != "" && newName != current.Name {
		if _, err := s.RenameStream(stream.ID, newName); err != nil {
			return income.Stream{}, err
		}

		incomeDir, err := a.store.IncomeDocsDir(stream.ProfileID)
		if err != nil {
			return income.Stream{}, err
		}
		oldDir := income.StreamDir(incomeDir, current.Name)
		newDir := income.StreamDir(incomeDir, newName)
		if _, statErr := os.Stat(oldDir); statErr == nil {
			if err := os.Rename(oldDir, newDir); err != nil {
				// Best-effort rollback so the db and disk don't disagree on the name.
				s.RenameStream(stream.ID, current.Name)
				return income.Stream{}, fmt.Errorf("rename income stream directory: %w", err)
			}
		} else if err := income.EnsureStreamDir(incomeDir, newName); err != nil {
			return income.Stream{}, fmt.Errorf("create renamed income stream directory: %w", err)
		}
	}

	return s.UpdateStream(stream)
}

// DeleteIncomeStream removes an income stream, every entry recorded against
// it, and the stream's on-disk document directory
// (<profile>/income/<name>). File/directory removal is best-effort - it
// doesn't fail the call, since the database rows are the source of truth.
func (a *App) DeleteIncomeStream(profileID string, streamID string) error {
	s, err := a.openIncomeStore(profileID)
	if err != nil {
		return err
	}
	defer s.Close()

	stream, err := s.GetStream(streamID)
	if err != nil {
		return err
	}
	entries, err := s.ListEntries(streamID, "")
	if err != nil {
		return err
	}

	if err := s.DeleteStream(streamID); err != nil {
		return err
	}

	for _, e := range entries {
		for _, path := range e.Directories {
			if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
				log.Printf("delete income entry attachment %q: %v", path, err)
			}
		}
	}

	incomeDir, err := a.store.IncomeDocsDir(profileID)
	if err != nil {
		return err
	}
	streamDir := income.StreamDir(incomeDir, stream.Name)
	if err := os.RemoveAll(streamDir); err != nil {
		log.Printf("remove income stream directory %q: %v", streamDir, err)
	}
	return nil
}

// ListIncomeEntries returns every income entry for the given profile,
// optionally filtered to a single income stream when incomeStreamID is
// non-empty and/or to a single pay period when monthYear ("MM/YY") is
// non-empty - MonthYear is the only date-based filter (Day is optional and
// never filtered on). The entry schema itself carries no profile id (it's
// already scoped by which profile's income.db it lives in) - profileID here
// only selects which database to open.
func (a *App) ListIncomeEntries(profileID string, incomeStreamID string, monthYear string) ([]income.Entry, error) {
	s, err := a.openIncomeStore(profileID)
	if err != nil {
		return nil, err
	}
	defer s.Close()
	return s.ListEntries(incomeStreamID, monthYear)
}

// CreateIncomeEntry records a new income entry against an existing income
// stream in the given profile's income.db.
func (a *App) CreateIncomeEntry(profileID string, entry income.Entry) (income.Entry, error) {
	s, err := a.openIncomeStore(profileID)
	if err != nil {
		return income.Entry{}, err
	}
	defer s.Close()
	return s.CreateEntry(entry)
}

// UpdateIncomeEntry overwrites an existing income entry's fields in the
// given profile's income.db.
func (a *App) UpdateIncomeEntry(profileID string, entry income.Entry) (income.Entry, error) {
	s, err := a.openIncomeStore(profileID)
	if err != nil {
		return income.Entry{}, err
	}
	defer s.Close()
	return s.UpdateEntry(entry)
}

// DeleteIncomeEntry removes an income entry from the given profile's
// income.db, along with every file previously attached to it via
// SaveIncomeAttachment. Attachment removal is best-effort - a
// missing/already-gone file doesn't fail the call, since the entry row is
// the source of truth.
func (a *App) DeleteIncomeEntry(profileID string, entryID string) error {
	s, err := a.openIncomeStore(profileID)
	if err != nil {
		return err
	}
	defer s.Close()

	entry, err := s.GetEntry(entryID)
	if err != nil {
		return err
	}
	if err := s.DeleteEntry(entryID); err != nil {
		return err
	}

	for _, path := range entry.Directories {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			log.Printf("delete income entry attachment %q: %v", path, err)
		}
	}
	return nil
}

// SaveIncomeAttachment writes fileName's bytes into the given income
// stream's document directory (<profile>/income/<stream>/<fileName>) and
// returns the saved path, for storing in an Entry's Directories. The
// caller (frontend) is responsible for making fileName unique (e.g.
// prefixing it with the entry id) so two attachments don't collide.
func (a *App) SaveIncomeAttachment(profileID string, streamName string, fileName string, data []byte) (string, error) {
	incomeDir, err := a.store.IncomeDocsDir(profileID)
	if err != nil {
		return "", err
	}
	if err := income.EnsureStreamDir(incomeDir, streamName); err != nil {
		return "", err
	}
	dest := filepath.Join(income.StreamDir(incomeDir, streamName), fileName)
	if err := os.WriteFile(dest, data, 0o644); err != nil {
		return "", fmt.Errorf("save income attachment: %w", err)
	}
	return dest, nil
}

// ReadIncomeAttachment reads back the raw bytes of a previously saved
// attachment (a path returned by SaveIncomeAttachment, stored in an
// Entry's Directories), for the Detailed table's View/Download buttons.
func (a *App) ReadIncomeAttachment(path string) ([]byte, error) {
	return os.ReadFile(path)
}

// DeleteIncomeAttachment removes a previously saved attachment (best-effort
// on disk - a missing file doesn't fail the call) and drops its path from
// the owning entry's Directories, for the Detailed table's per-row delete
// button.
func (a *App) DeleteIncomeAttachment(profileID string, entryID string, path string) (income.Entry, error) {
	s, err := a.openIncomeStore(profileID)
	if err != nil {
		return income.Entry{}, err
	}
	defer s.Close()

	entry, err := s.GetEntry(entryID)
	if err != nil {
		return income.Entry{}, err
	}

	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		log.Printf("delete income attachment %q: %v", path, err)
	}

	remaining := make([]string, 0, len(entry.Directories))
	for _, d := range entry.Directories {
		if d != path {
			remaining = append(remaining, d)
		}
	}
	entry.Directories = remaining

	return s.UpdateEntry(entry)
}
