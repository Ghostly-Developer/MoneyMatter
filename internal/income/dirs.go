package income

import (
	"os"
	"path/filepath"

	"MoneyMatter/internal/paths"
)

// StreamDir returns the directory that holds one income stream's uploaded
// payslip/proof-of-income documents, under the profile's income folder:
// <profile>/income/<sanitized stream name>
func StreamDir(profileIncomeDir, streamName string) string {
	return filepath.Join(profileIncomeDir, paths.SanitizeDirName(streamName, "stream"))
}

// EnsureStreamDir creates the on-disk directory for a stream's documents.
func EnsureStreamDir(profileIncomeDir, streamName string) error {
	return os.MkdirAll(StreamDir(profileIncomeDir, streamName), 0o755)
}
