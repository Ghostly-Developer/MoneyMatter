// Package paths resolves the OS-appropriate root directory MoneyMatter
// stores its local data under.
package paths

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// DataDirName is the top-level folder that holds all of MoneyMatter's local
// data: the master profile database plus one subdirectory per profile.
const DataDirName = "MoneyMatter_Database"

// DataDir resolves (and creates, if missing) the root Database directory
// next to the running executable, so the app is portable (data travels with
// the binary instead of being scattered into a per-user OS config location).
func DataDir() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	exe, err = filepath.EvalSymlinks(exe)
	if err != nil {
		return "", err
	}
	dir := filepath.Join(filepath.Dir(exe), DataDirName)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

// invalidDirChars matches characters that are unsafe/illegal in a directory
// name on at least one of Windows/macOS/Linux.
var invalidDirChars = regexp.MustCompile(`[<>:"/\\|?*\x00-\x1F]`)

// SanitizeDirName turns an arbitrary user-provided name (a profile name, an
// income stream name, ...) into a safe, non-empty directory name, falling
// back to fallback if nothing usable remains. Shared by every package that
// names a directory after a user-provided string, so a profile directory and
// an income-stream directory sanitize identically.
func SanitizeDirName(name, fallback string) string {
	name = strings.TrimSpace(name)
	name = invalidDirChars.ReplaceAllString(name, "_")
	name = strings.TrimRight(name, " .") // trailing dot/space is invalid on Windows
	if name == "" {
		name = fallback
	}
	return name
}
