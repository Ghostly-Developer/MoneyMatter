package income

import (
	"database/sql"
	"path/filepath"
	"testing"
)

func openTestStore(t *testing.T) *Store {
	t.Helper()
	s, err := Open(filepath.Join(t.TempDir(), "income.db"))
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestCreateStreamGeneratesID(t *testing.T) {
	s := openTestStore(t)

	st, err := s.CreateStream(Stream{
		ID:          "should-be-ignored",
		ProfileID:   "profile-1",
		Name:        "Salary",
		SourceType:  SourceTypeAccount,
		TaxStatus:   TaxStatusTaxed,
		BankAccount: "HDFC Bank",
	})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}
	if st.ID == "" || st.ID == "should-be-ignored" {
		t.Fatalf("expected server-generated id, got %q", st.ID)
	}
	if st.LastUpdated.IsZero() {
		t.Fatalf("expected LastUpdated to be set")
	}
}

func TestCreateStreamNameUnique(t *testing.T) {
	s := openTestStore(t)

	base := Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed}
	if _, err := s.CreateStream(base); err != nil {
		t.Fatalf("CreateStream: %v", err)
	}
	if _, err := s.CreateStream(base); err != ErrStreamNameTaken {
		t.Fatalf("expected ErrStreamNameTaken, got %v", err)
	}
}

func TestCreateStreamRequiresBankAccountForAccountOrBothType(t *testing.T) {
	s := openTestStore(t)

	if _, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeAccount, TaxStatus: TaxStatusTaxed}); err == nil {
		t.Fatalf("expected error when bank account missing for account source type")
	}
	if _, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Mixed", SourceType: SourceTypeBoth, TaxStatus: TaxStatusBoth}); err == nil {
		t.Fatalf("expected error when bank account missing for both source type")
	}
	if _, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Cash Gigs", SourceType: SourceTypeCash, TaxStatus: TaxStatusNonTaxed}); err != nil {
		t.Fatalf("expected cash stream without bank account to succeed: %v", err)
	}
}

func TestCreateStreamRejectsInvalidEnums(t *testing.T) {
	s := openTestStore(t)

	if _, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: "wire", TaxStatus: TaxStatusTaxed}); err == nil {
		t.Fatalf("expected error for invalid source type")
	}
	if _, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: "half"}); err == nil {
		t.Fatalf("expected error for invalid tax status")
	}
}

func TestUpdateStreamBumpsLastUpdatedAndKeepsName(t *testing.T) {
	s := openTestStore(t)

	st, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}
	firstUpdated := st.LastUpdated

	st.TaxStatus = TaxStatusNonTaxed
	st.Name = "Renamed" // should be ignored by UpdateStream
	updated, err := s.UpdateStream(st)
	if err != nil {
		t.Fatalf("UpdateStream: %v", err)
	}
	if updated.TaxStatus != TaxStatusNonTaxed {
		t.Fatalf("expected tax status updated, got %v", updated.TaxStatus)
	}
	if updated.Name != "Salary" {
		t.Fatalf("expected name unchanged, got %q", updated.Name)
	}
	if !updated.LastUpdated.After(firstUpdated) {
		t.Fatalf("expected LastUpdated to advance")
	}
}

func TestUpdateUnknownStreamFails(t *testing.T) {
	s := openTestStore(t)

	_, err := s.UpdateStream(Stream{ID: "ghost", ProfileID: "profile-1", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != ErrStreamNotFound {
		t.Fatalf("expected ErrStreamNotFound, got %v", err)
	}
}

func TestListStreams(t *testing.T) {
	s := openTestStore(t)

	if _, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed}); err != nil {
		t.Fatalf("CreateStream(Salary): %v", err)
	}
	if _, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Freelance", SourceType: SourceTypeCash, TaxStatus: TaxStatusNonTaxed}); err != nil {
		t.Fatalf("CreateStream(Freelance): %v", err)
	}

	streams, err := s.ListStreams()
	if err != nil {
		t.Fatalf("ListStreams: %v", err)
	}
	if len(streams) != 2 {
		t.Fatalf("expected 2 streams, got %d", len(streams))
	}
}

func TestCreateEntryRequiresExistingStream(t *testing.T) {
	s := openTestStore(t)

	_, err := s.CreateEntry(Entry{Name: "Jan Entry", IncomeStreamID: "ghost", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000})
	if err != ErrStreamNotFound {
		t.Fatalf("expected ErrStreamNotFound, got %v", err)
	}
}

func TestCreateEntryRejectsBothAsSourceTypeOrTaxStatus(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeBoth, TaxStatus: TaxStatusBoth, BankAccount: "HDFC Bank"})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	if _, err := s.CreateEntry(Entry{Name: "P1", IncomeStreamID: stream.ID, SourceType: SourceTypeBoth, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000}); err == nil {
		t.Fatalf("expected error for source type 'both' on an entry")
	}
	if _, err := s.CreateEntry(Entry{Name: "P2", IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusBoth, MonthYear: "01/26", Amount: 1000}); err == nil {
		t.Fatalf("expected error for tax status 'both' on an entry")
	}
}

func TestCreateEntryRequiresBankAccountForAccountType(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeBoth, TaxStatus: TaxStatusBoth, BankAccount: "HDFC Bank"})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	if _, err := s.CreateEntry(Entry{Name: "P1", IncomeStreamID: stream.ID, SourceType: SourceTypeAccount, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000}); err == nil {
		t.Fatalf("expected error when bank account missing for account source type")
	}
}

func TestCreateEntryValidatesMonthYearFormat(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	valid := []string{"01/26", "12/99"}
	for _, my := range valid {
		if _, err := s.CreateEntry(Entry{Name: "Entry " + my, IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: my, Amount: 1000}); err != nil {
			t.Fatalf("expected month/year %q to be valid: %v", my, err)
		}
	}

	invalid := []string{"2026-01", "13/26", "1/2026", "31/01/26", ""}
	for _, my := range invalid {
		if _, err := s.CreateEntry(Entry{Name: "Bad " + my, IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: my, Amount: 1000}); err == nil {
			t.Fatalf("expected month/year %q to be rejected", my)
		}
	}
}

func TestCreateEntryValidatesOptionalDayFormat(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	// Day is optional - omitting it entirely must succeed.
	if _, err := s.CreateEntry(Entry{Name: "No Day", IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000}); err != nil {
		t.Fatalf("expected entry without Day to be valid: %v", err)
	}

	valid := []string{"01", "31"}
	for _, d := range valid {
		if _, err := s.CreateEntry(Entry{Name: "Day " + d, IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Day: d, Amount: 1000}); err != nil {
			t.Fatalf("expected day %q to be valid: %v", d, err)
		}
	}

	invalid := []string{"32", "00", "1", "31/01/26"}
	for _, d := range invalid {
		if _, err := s.CreateEntry(Entry{Name: "Bad Day " + d, IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Day: d, Amount: 1000}); err == nil {
			t.Fatalf("expected day %q to be rejected", d)
		}
	}
}

func TestCreateAndListEntries(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeAccount, TaxStatus: TaxStatusTaxed, BankAccount: "HDFC Bank"})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	e, err := s.CreateEntry(Entry{
		ID:             "should-be-ignored",
		Name:           "January Entry",
		IncomeStreamID: stream.ID,
		SourceType:     SourceTypeAccount,
		TaxStatus:      TaxStatusTaxed,
		BankAccount:    "HDFC Bank",
		MonthYear:      "01/26",
		Day:            "31",
		Amount:         5000,
		Directories:    []string{"income/Salary/2026-01-payslip.pdf", "income/Salary/2026-01-bonus.pdf"},
	})
	if err != nil {
		t.Fatalf("CreateEntry: %v", err)
	}
	if e.ID == "" || e.ID == "should-be-ignored" {
		t.Fatalf("expected server-generated id, got %q", e.ID)
	}

	fetched, err := s.GetEntry(e.ID)
	if err != nil {
		t.Fatalf("GetEntry: %v", err)
	}
	if len(fetched.Directories) != 2 {
		t.Fatalf("expected 2 directories, got %v", fetched.Directories)
	}
	if fetched.MonthYear != "01/26" || fetched.Day != "31" {
		t.Fatalf("expected MonthYear %q and Day %q, got MonthYear %q and Day %q", "01/26", "31", fetched.MonthYear, fetched.Day)
	}

	all, err := s.ListEntries("", "")
	if err != nil {
		t.Fatalf("ListEntries: %v", err)
	}
	if len(all) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(all))
	}

	scoped, err := s.ListEntries(stream.ID, "")
	if err != nil {
		t.Fatalf("ListEntries(stream): %v", err)
	}
	if len(scoped) != 1 {
		t.Fatalf("expected 1 entry for stream, got %d", len(scoped))
	}

	none, err := s.ListEntries("other-stream-id", "")
	if err != nil {
		t.Fatalf("ListEntries(other): %v", err)
	}
	if len(none) != 0 {
		t.Fatalf("expected 0 entries for other stream, got %d", len(none))
	}

	byMonthYear, err := s.ListEntries("", "01/26")
	if err != nil {
		t.Fatalf("ListEntries(monthYear): %v", err)
	}
	if len(byMonthYear) != 1 {
		t.Fatalf("expected 1 entry for month/year 01/26, got %d", len(byMonthYear))
	}

	otherMonthYear, err := s.ListEntries("", "02/26")
	if err != nil {
		t.Fatalf("ListEntries(other monthYear): %v", err)
	}
	if len(otherMonthYear) != 0 {
		t.Fatalf("expected 0 entries for month/year 02/26, got %d", len(otherMonthYear))
	}
}

func TestEntryNameUnique(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	base := Entry{Name: "January Entry", IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000}
	if _, err := s.CreateEntry(base); err != nil {
		t.Fatalf("CreateEntry: %v", err)
	}
	if _, err := s.CreateEntry(base); err != ErrEntryNameTaken {
		t.Fatalf("expected ErrEntryNameTaken, got %v", err)
	}
}

func TestUpdateEntry(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}
	e, err := s.CreateEntry(Entry{Name: "January Entry", IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000})
	if err != nil {
		t.Fatalf("CreateEntry: %v", err)
	}

	e.TaxStatus = TaxStatusNonTaxed
	e.Directories = []string{"income/Salary/updated.pdf"}
	updated, err := s.UpdateEntry(e)
	if err != nil {
		t.Fatalf("UpdateEntry: %v", err)
	}
	if updated.TaxStatus != TaxStatusNonTaxed {
		t.Fatalf("expected tax status updated, got %v", updated.TaxStatus)
	}
	if len(updated.Directories) != 1 {
		t.Fatalf("expected 1 directory, got %v", updated.Directories)
	}
}

// TestCreateEntrySucceedsAgainstLegacyDateColumn reproduces a real profile
// database created before Date was split into MonthYear + Day: the original
// `date TEXT NOT NULL` column was left behind (the split only ever added
// month_year/day via ALTER TABLE ADD COLUMN), so every insert failed with a
// NOT NULL constraint violation on `date` until Open's migration rebuilds
// the table to drop it.
func TestCreateEntrySucceedsAgainstLegacyDateColumn(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "income.db")

	raw, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open raw db: %v", err)
	}
	if _, err := raw.Exec(`
CREATE TABLE income_streams (
	id            TEXT PRIMARY KEY NOT NULL,
	profile_id    TEXT NOT NULL,
	name          TEXT NOT NULL UNIQUE,
	source_type   TEXT NOT NULL,
	tax_status    TEXT NOT NULL,
	bank_account  TEXT,
	last_updated  TIMESTAMP NOT NULL
);
CREATE TABLE income_entries (
	id                 TEXT PRIMARY KEY NOT NULL,
	name               TEXT NOT NULL UNIQUE,
	income_stream_id   TEXT NOT NULL REFERENCES income_streams(id),
	date               TEXT NOT NULL,
	source_type        TEXT NOT NULL,
	tax_status         TEXT NOT NULL,
	bank_account       TEXT,
	directories        TEXT,
	last_updated       TIMESTAMP NOT NULL
);`); err != nil {
		t.Fatalf("create legacy schema: %v", err)
	}
	if err := raw.Close(); err != nil {
		t.Fatalf("close raw db: %v", err)
	}

	s, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { s.Close() })

	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	if _, err := s.CreateEntry(Entry{Name: "January Entry", IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000}); err != nil {
		t.Fatalf("CreateEntry against migrated legacy schema: %v", err)
	}
}

// TestCreateEntrySucceedsAgainstLegacyPayslipsTable reproduces a real
// profile database created before Payslip was renamed to Entry: the
// on-disk table was still named `payslips` until Open's migration renames
// it to `income_entries`.
func TestCreateEntrySucceedsAgainstLegacyPayslipsTable(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "income.db")

	raw, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open raw db: %v", err)
	}
	if _, err := raw.Exec(`
CREATE TABLE income_streams (
	id            TEXT PRIMARY KEY NOT NULL,
	profile_id    TEXT NOT NULL,
	name          TEXT NOT NULL UNIQUE,
	source_type   TEXT NOT NULL,
	tax_status    TEXT NOT NULL,
	bank_account  TEXT,
	last_updated  TIMESTAMP NOT NULL
);
CREATE TABLE payslips (
	id                 TEXT PRIMARY KEY NOT NULL,
	name               TEXT NOT NULL UNIQUE,
	income_stream_id   TEXT NOT NULL REFERENCES income_streams(id),
	month_year         TEXT,
	day                TEXT,
	source_type        TEXT NOT NULL,
	tax_status         TEXT NOT NULL,
	bank_account       TEXT,
	amount             REAL,
	tax_amount         REAL,
	deductions         REAL,
	directories        TEXT,
	last_updated       TIMESTAMP NOT NULL
);
INSERT INTO income_streams (id, profile_id, name, source_type, tax_status, bank_account, last_updated)
	VALUES ('stream-1', 'profile-1', 'Salary', 'cash', 'taxed', NULL, '2026-01-01T00:00:00Z');
INSERT INTO payslips (id, name, income_stream_id, month_year, day, source_type, tax_status, bank_account, amount, tax_amount, deductions, directories, last_updated)
	VALUES ('entry-1', 'January Entry', 'stream-1', '01/26', NULL, 'cash', 'taxed', NULL, 1000, 0, 0, NULL, '2026-01-01T00:00:00Z');`); err != nil {
		t.Fatalf("create legacy schema: %v", err)
	}
	if err := raw.Close(); err != nil {
		t.Fatalf("close raw db: %v", err)
	}

	s, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { s.Close() })

	entries, err := s.ListEntries("", "")
	if err != nil {
		t.Fatalf("ListEntries against migrated legacy payslips table: %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("expected the pre-existing payslips row to carry over, got %d entries", len(entries))
	}
}

func TestEntryRequiresPositiveAmount(t *testing.T) {
	s := openTestStore(t)
	stream, err := s.CreateStream(Stream{ProfileID: "profile-1", Name: "Salary", SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed})
	if err != nil {
		t.Fatalf("CreateStream: %v", err)
	}

	invalid := []float64{0, -1, -1000}
	for _, amount := range invalid {
		if _, err := s.CreateEntry(Entry{Name: "Entry", IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: amount}); err == nil {
			t.Fatalf("expected amount %v to be rejected", amount)
		}
	}

	e, err := s.CreateEntry(Entry{Name: "Entry", IncomeStreamID: stream.ID, SourceType: SourceTypeCash, TaxStatus: TaxStatusTaxed, MonthYear: "01/26", Amount: 1000})
	if err != nil {
		t.Fatalf("CreateEntry: %v", err)
	}

	e.Amount = 0
	if _, err := s.UpdateEntry(e); err == nil {
		t.Fatalf("expected UpdateEntry to reject a zero amount")
	}
}
