package profile

import (
	"archive/zip"
	"bytes"
	"os"
	"path/filepath"
	"testing"
)

func TestExportProfileZipsDirectory(t *testing.T) {
	dataDir := t.TempDir()
	s, err := Open(dataDir)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	frank, err := s.Create(Profile{Name: "Frank"})
	if err != nil {
		t.Fatalf("Create(Frank): %v", err)
	}

	incomeFile := filepath.Join(dataDir, "profiles", "Frank", "income", "payslip.txt")
	if err := os.WriteFile(incomeFile, []byte("payslip contents"), 0o644); err != nil {
		t.Fatalf("write income file: %v", err)
	}

	export, err := s.ExportProfile(frank.ID)
	if err != nil {
		t.Fatalf("ExportProfile: %v", err)
	}
	if export.Filename != "Frank-export.zip" {
		t.Fatalf("expected filename Frank-export.zip, got %q", export.Filename)
	}

	r, err := zip.NewReader(bytes.NewReader(export.Data), int64(len(export.Data)))
	if err != nil {
		t.Fatalf("read zip: %v", err)
	}

	var found bool
	for _, f := range r.File {
		if filepath.ToSlash(f.Name) != "income/payslip.txt" {
			continue
		}
		found = true
		rc, err := f.Open()
		if err != nil {
			t.Fatalf("open zip entry: %v", err)
		}
		defer rc.Close()
		buf := new(bytes.Buffer)
		if _, err := buf.ReadFrom(rc); err != nil {
			t.Fatalf("read zip entry: %v", err)
		}
		if buf.String() != "payslip contents" {
			t.Fatalf("expected payslip contents, got %q", buf.String())
		}
	}
	if !found {
		t.Fatalf("expected income/payslip.txt in zip, entries: %v", r.File)
	}
}

func TestExportProfileUnknownID(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	if _, err := s.ExportProfile("does-not-exist"); err != ErrProfileNotFound {
		t.Fatalf("expected ErrProfileNotFound, got %v", err)
	}
}
