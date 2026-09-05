package main

import (
	"context"
	"fmt"
	"log"

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

// ExportProfileData zips the given profile's on-disk directory (its db and
// uploaded documents) so the frontend can save it, for Settings -> Export
// Data.
func (a *App) ExportProfileData(profileID string) (profile.ProfileExport, error) {
	return a.store.ExportProfile(profileID)
}
