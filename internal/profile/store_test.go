package profile

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGuestSeededAsAdmin(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	guest, err := s.Get(GuestProfileID)
	if err != nil {
		t.Fatalf("Get(guest): %v", err)
	}
	if !guest.IsAdmin {
		t.Fatalf("expected guest profile to be admin by default")
	}
}

func TestOnlyOneAdminAtATime(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	alice, err := s.Create(Profile{Name: "Alice", IsAdmin: true})
	if err != nil {
		t.Fatalf("Create(Alice): %v", err)
	}
	if !alice.IsAdmin {
		t.Fatalf("expected Alice to be admin")
	}

	guest, err := s.Get(GuestProfileID)
	if err != nil {
		t.Fatalf("Get(guest): %v", err)
	}
	if guest.IsAdmin {
		t.Fatalf("expected guest to lose admin once Alice became admin")
	}

	bob, err := s.Create(Profile{Name: "Bob"})
	if err != nil {
		t.Fatalf("Create(Bob): %v", err)
	}
	bob.IsAdmin = true
	if err := s.Update(bob); err != nil {
		t.Fatalf("Update(Bob admin): %v", err)
	}

	alice, err = s.Get(alice.ID)
	if err != nil {
		t.Fatalf("Get(Alice): %v", err)
	}
	if alice.IsAdmin {
		t.Fatalf("expected Alice to lose admin once Bob became admin")
	}
}

func TestProfileNameUnique(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	if _, err := s.Create(Profile{Name: "Guest"}); err == nil {
		t.Fatalf("expected duplicate name to fail")
	} else if err != ErrProfileNameTaken {
		t.Fatalf("expected ErrProfileNameTaken, got %v", err)
	}
}

func TestCreateIgnoresProvidedID(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	p, err := s.Create(Profile{ID: "should-be-ignored", Name: "Carol"})
	if err != nil {
		t.Fatalf("Create(Carol): %v", err)
	}
	if p.ID == "should-be-ignored" || p.ID == "" {
		t.Fatalf("expected server-generated id, got %q", p.ID)
	}
}

func TestRenameProfileMovesDirectory(t *testing.T) {
	dataDir := t.TempDir()
	s, err := Open(dataDir)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	dave, err := s.Create(Profile{Name: "Dave"})
	if err != nil {
		t.Fatalf("Create(Dave): %v", err)
	}

	oldDir := filepath.Join(dataDir, "profiles", "Dave")
	if _, err := os.Stat(oldDir); err != nil {
		t.Fatalf("expected old profile dir to exist: %v", err)
	}

	renamed, err := s.RenameProfile(dave.ID, "David")
	if err != nil {
		t.Fatalf("RenameProfile: %v", err)
	}
	if renamed.Name != "David" {
		t.Fatalf("expected renamed profile name David, got %q", renamed.Name)
	}

	if _, err := os.Stat(oldDir); !os.IsNotExist(err) {
		t.Fatalf("expected old profile dir to be gone, stat err = %v", err)
	}
	newDir := filepath.Join(dataDir, "profiles", "David")
	if _, err := os.Stat(filepath.Join(newDir, "db")); err != nil {
		t.Fatalf("expected new profile dir with db subfolder: %v", err)
	}

	fetched, err := s.Get(dave.ID)
	if err != nil {
		t.Fatalf("Get after rename: %v", err)
	}
	if fetched.Name != "David" {
		t.Fatalf("expected persisted name David, got %q", fetched.Name)
	}
}

func TestUpdateDoesNotChangeName(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	defer s.Close()

	eve, err := s.Create(Profile{Name: "Eve"})
	if err != nil {
		t.Fatalf("Create(Eve): %v", err)
	}

	eve.Currency = "USD"
	if err := s.Update(eve); err != nil {
		t.Fatalf("Update(Eve): %v", err)
	}

	fetched, err := s.Get(eve.ID)
	if err != nil {
		t.Fatalf("Get(Eve): %v", err)
	}
	if fetched.Name != "Eve" {
		t.Fatalf("expected name unchanged, got %q", fetched.Name)
	}
	if fetched.Currency != "USD" {
		t.Fatalf("expected currency updated, got %q", fetched.Currency)
	}
}
