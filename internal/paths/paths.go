// Package paths resolves the OS-appropriate root directory MoneyMatter
// stores its local data under.
package paths

import (
	"os"
	"path/filepath"
)

// DataDirName is the top-level folder that holds all of MoneyMatter's local
// data: the master profile database plus one subdirectory per profile.
const DataDirName = "MoneyMatter_Database"

// DataDir resolves (and creates, if missing) the root Database directory
// under the OS-appropriate per-user config location (e.g. %AppData% on
// Windows, ~/.config on Linux, ~/Library/Application Support on macOS).
func DataDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, DataDirName)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}
