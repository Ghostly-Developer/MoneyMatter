package profile

import (
	"os"
	"path/filepath"

	"MoneyMatter/internal/paths"
)

// sanitizeDirName turns a profile name into a safe, non-empty directory
// name. Profile names are unique (enforced at the DB layer), so the
// sanitized name is what actually identifies the profile's directory on
// disk.
func sanitizeDirName(name string) string {
	return paths.SanitizeDirName(name, "profile")
}

// profileDir returns the directory for a profile with the given name,
// under dataDir: <dataDir>/profiles/<sanitized name>
func profileDir(dataDir, name string) string {
	return filepath.Join(dataDir, "profiles", sanitizeDirName(name))
}

// profileSubdirs are the fixed set of folders created inside every profile
// directory. "db" holds that profile's own SQLite databases (income,
// expense, investment, taxes); the rest hold the uploaded source documents
// for each of those areas.
var profileSubdirs = []string{"db", "income", "expense", "investment", "taxes"}

// EnsureProfileDirs creates the on-disk folder structure for a profile,
// named after the profile's (unique) name:
//
//	<dataDir>/profiles/<name>/db
//	<dataDir>/profiles/<name>/income
//	<dataDir>/profiles/<name>/expense
//	<dataDir>/profiles/<name>/investment
//	<dataDir>/profiles/<name>/taxes
func EnsureProfileDirs(dataDir, name string) error {
	dir := profileDir(dataDir, name)
	for _, sub := range profileSubdirs {
		if err := os.MkdirAll(filepath.Join(dir, sub), 0o755); err != nil {
			return err
		}
	}
	return nil
}
