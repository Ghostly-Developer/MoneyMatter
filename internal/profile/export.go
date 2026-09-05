package profile

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// ProfileExport is the payload returned to the frontend for Settings ->
// Export Data: the whole profile directory (db + uploaded documents),
// zipped, plus a filename to save it as.
//
// Named ProfileExport rather than the shorter Export because Wails' binding
// generator treats "Export" as a reserved keyword and refuses to generate
// frontend types for it.
type ProfileExport struct {
	Filename string `json:"filename"`
	Data     []byte `json:"data"`
}

// ExportProfile zips the on-disk directory of the profile with the given id
// (<dataDir>/profiles/<name>) and returns it ready for the frontend to save.
func (s *Store) ExportProfile(id string) (ProfileExport, error) {
	p, err := s.Get(id)
	if err != nil {
		return ProfileExport{}, err
	}

	dir := profileDir(s.dataDir, p.Name)
	data, err := zipDir(dir)
	if err != nil {
		return ProfileExport{}, fmt.Errorf("zip profile directory: %w", err)
	}

	return ProfileExport{
		Filename: fmt.Sprintf("%s-export.zip", sanitizeDirName(p.Name)),
		Data:     data,
	}, nil
}

// zipDir archives every file under dir into an in-memory zip, with paths
// relative to dir so the archive's root is the profile folder's contents
// (db/, income/, expense/, investment/, taxes/), not the absolute path.
func zipDir(dir string) ([]byte, error) {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(dir, path)
		if err != nil {
			return err
		}

		entry, err := w.Create(filepath.ToSlash(rel))
		if err != nil {
			return err
		}
		f, err := os.Open(path)
		if err != nil {
			return err
		}
		defer f.Close()

		_, err = io.Copy(entry, f)
		return err
	})
	if err != nil {
		w.Close()
		return nil, err
	}

	if err := w.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
