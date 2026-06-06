package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

// Transaction represents a transaction record
type Transaction struct {
	ID        int       `json:"id"`
	Category  string    `json:"category"`
	Type      string    `json:"type"`
	Amount    float64   `json:"amount"`
	CreatedAt time.Time `json:"created_at"`
}

// DatabaseManager handles all database operations
type DatabaseManager struct {
	db *sql.DB
}

// InitializeDatabase initializes the SQLite database
func InitializeDatabase() (*DatabaseManager, error) {
	// Create database directory if it doesn't exist
	dbDir := filepath.Join("MoneyMatter_Databse", "db")
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	// Create database file path
	dbPath := filepath.Join(dbDir, "expense.db")

	// Open database connection
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	dm := &DatabaseManager{db: db}

	// Create tables if they don't exist
	if err := dm.createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return dm, nil
}

// createTables creates the necessary database tables
func (dm *DatabaseManager) createTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		category TEXT NOT NULL,
		type TEXT NOT NULL,
		amount REAL NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err := dm.db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to create transactions table: %w", err)
	}

	return nil
}

// SaveTransaction saves a transaction to the database
func (dm *DatabaseManager) SaveTransaction(category, transactionType string, amount float64) (*Transaction, error) {
	if category == "" || transactionType == "" || amount <= 0 {
		return nil, fmt.Errorf("invalid transaction data: all fields are required and amount must be positive")
	}

	result, err := dm.db.Exec(
		"INSERT INTO transactions (category, type, amount) VALUES (?, ?, ?)",
		category,
		transactionType,
		amount,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert transaction: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	return &Transaction{
		ID:        int(id),
		Category:  category,
		Type:      transactionType,
		Amount:    amount,
		CreatedAt: time.Now(),
	}, nil
}

// GetAllTransactions retrieves all transactions from the database
func (dm *DatabaseManager) GetAllTransactions() ([]Transaction, error) {
	rows, err := dm.db.Query("SELECT id, category, type, amount, created_at FROM transactions ORDER BY created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("failed to query transactions: %w", err)
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.Category, &t.Type, &t.Amount, &t.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}
		transactions = append(transactions, t)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating transactions: %w", err)
	}

	return transactions, nil
}

// Close closes the database connection
func (dm *DatabaseManager) Close() error {
	if dm.db != nil {
		return dm.db.Close()
	}
	return nil
}
