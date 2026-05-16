package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// App struct
type App struct {
	ctx context.Context
}

// Entry is written to JSON files.
type Entry struct {
	Text    string `json:"text"`
	GoCode  string `json:"go_code"`
	SavedAt string `json:"saved_at"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func findProjectRoot(start string) string {
	dir := start
	for {
		if fileExists(filepath.Join(dir, "wails.json")) || fileExists(filepath.Join(dir, "go.mod")) {
			return dir
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return ""
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func getSaveDir() (string, error) {
	wd, err := os.Getwd()
	if err == nil {
		if projectRoot := findProjectRoot(wd); projectRoot != "" {
			return filepath.Join(projectRoot, "saved_entries"), nil
		}
	}

	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if exeDir != "" {
			return filepath.Join(exeDir, "saved_entries"), nil
		}
	}

	configDir, err := os.UserConfigDir()
	if err == nil {
		return filepath.Join(configDir, "poc", "saved_entries"), nil
	}

	homeDir, err := os.UserHomeDir()
	if err == nil {
		return filepath.Join(homeDir, ".poc", "saved_entries"), nil
	}

	return "", fmt.Errorf("could not determine a save directory")
}

// SaveEntry writes a simple text + Go code payload to a JSON file.
func (a *App) SaveEntry(text string, code string) (string, error) {
	saveDir, err := getSaveDir()
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(saveDir, 0o755); err != nil {
		return "", err
	}

	entry := Entry{
		Text:    text,
		GoCode:  code,
		SavedAt: time.Now().Format(time.RFC3339),
	}

	filePath := filepath.Join(saveDir, fmt.Sprintf("entry-%d.json", time.Now().UnixNano()))
	fileData, err := json.MarshalIndent(entry, "", "  ")
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(filePath, fileData, 0o644); err != nil {
		return "", err
	}

	return filePath, nil
}
