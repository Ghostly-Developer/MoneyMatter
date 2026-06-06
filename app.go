package main

import (
	"context"
	"fmt"
)

// App struct
type App struct {
	ctx context.Context
	db  *DatabaseManager
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database
	var err error
	a.db, err = InitializeDatabase()
	if err != nil {
		println("Error initializing database:", err.Error())
	}
}

// shutdown is called when the app is about to quit
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		if err := a.db.Close(); err != nil {
			println("Error closing database:", err.Error())
		}
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// SaveTransaction saves a transaction to the database
func (a *App) SaveTransaction(category, transactionType string, amount float64) (map[string]interface{}, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	transaction, err := a.db.SaveTransaction(category, transactionType, amount)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":         transaction.ID,
		"category":   transaction.Category,
		"type":       transaction.Type,
		"amount":     transaction.Amount,
		"created_at": transaction.CreatedAt,
	}, nil
}

// GetTransactions retrieves all transactions
func (a *App) GetTransactions() ([]map[string]interface{}, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	transactions, err := a.db.GetAllTransactions()
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	for _, t := range transactions {
		result = append(result, map[string]interface{}{
			"id":         t.ID,
			"category":   t.Category,
			"type":       t.Type,
			"amount":     t.Amount,
			"created_at": t.CreatedAt,
		})
	}

	return result, nil
}
