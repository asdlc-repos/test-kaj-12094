package store

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"

	"github.com/kaje94/todo-api/models"
)

const writeTimeout = 500 * time.Millisecond

type Store struct {
	db *sql.DB
}

func Open(path string) (*Store, error) {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create db dir: %w", err)
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		db.Close()
		return nil, fmt.Errorf("set WAL mode: %w", err)
	}

	if err := createTables(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("create tables: %w", err)
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func createTables(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS sessions (
			token TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expires_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			created_at TEXT NOT NULL,
			UNIQUE(user_id, name)
		);
		CREATE TABLE IF NOT EXISTS tasks (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			category_id TEXT,
			due_date TEXT,
			completed INTEGER NOT NULL DEFAULT 0,
			completed_at TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`)
	return err
}

// User operations

func (s *Store) CreateUser(ctx context.Context, u *models.User) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`,
		u.ID, u.Email, u.PasswordHash, u.CreatedAt,
	)
	if err != nil {
		if isUniqueConstraint(err) {
			return ErrConflict
		}
		return err
	}
	return nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, email, password_hash, created_at FROM users WHERE email = ?`, email)
	u := &models.User{}
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return u, nil
}

// Session operations

func (s *Store) CreateSession(ctx context.Context, sess *models.Session) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
		sess.Token, sess.UserID, sess.ExpiresAt,
	)
	return err
}

func (s *Store) GetSession(ctx context.Context, token string) (*models.Session, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT token, user_id, expires_at FROM sessions WHERE token = ?`, token)
	sess := &models.Session{}
	if err := row.Scan(&sess.Token, &sess.UserID, &sess.ExpiresAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return sess, nil
}

func (s *Store) DeleteSession(ctx context.Context, token string) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	_, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE token = ?`, token)
	return err
}

// Task operations

func (s *Store) CreateTask(ctx context.Context, t *models.Task) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tasks (id, user_id, title, description, category_id, due_date, completed, completed_at, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, t.UserID, t.Title, t.Description, t.CategoryID, t.DueDate,
		boolToInt(t.Completed), t.CompletedAt, t.CreatedAt, t.UpdatedAt,
	)
	return err
}

func (s *Store) GetTask(ctx context.Context, id, userID string) (*models.Task, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, title, description, category_id, due_date, completed, completed_at, created_at, updated_at
		 FROM tasks WHERE id = ? AND user_id = ?`, id, userID)
	return scanTask(row)
}

func (s *Store) ListTasks(ctx context.Context, userID string, f models.TaskFilters) ([]*models.Task, error) {
	query := `SELECT id, user_id, title, description, category_id, due_date, completed, completed_at, created_at, updated_at
	          FROM tasks WHERE user_id = ?`
	args := []any{userID}

	if f.Status == "complete" {
		query += " AND completed = 1"
	} else if f.Status == "incomplete" {
		query += " AND completed = 0"
	}

	if f.CategoryID != "" {
		query += " AND category_id = ?"
		args = append(args, f.CategoryID)
	}

	if f.DueFrom != "" {
		query += " AND due_date >= ?"
		args = append(args, f.DueFrom)
	}

	if f.DueTo != "" {
		query += " AND due_date <= ?"
		args = append(args, f.DueTo)
	}

	query += " ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at ASC"

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		t, err := scanTaskRow(rows)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	if tasks == nil {
		tasks = []*models.Task{}
	}
	return tasks, rows.Err()
}

func (s *Store) UpdateTask(ctx context.Context, t *models.Task) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	result, err := s.db.ExecContext(ctx,
		`UPDATE tasks SET title=?, description=?, category_id=?, due_date=?, updated_at=?
		 WHERE id=? AND user_id=?`,
		t.Title, t.Description, t.CategoryID, t.DueDate, t.UpdatedAt, t.ID, t.UserID,
	)
	if err != nil {
		return err
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) DeleteTask(ctx context.Context, id, userID string) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	result, err := s.db.ExecContext(ctx,
		`DELETE FROM tasks WHERE id=? AND user_id=?`, id, userID)
	if err != nil {
		return err
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ToggleTask(ctx context.Context, id, userID string) (*models.Task, error) {
	writeCtx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()

	now := time.Now().UTC().Format(time.RFC3339)

	result, err := s.db.ExecContext(writeCtx,
		`UPDATE tasks SET
			completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END,
			completed_at = CASE WHEN completed = 0 THEN ? ELSE NULL END,
			updated_at = ?
		 WHERE id = ? AND user_id = ?`,
		now, now, id, userID,
	)
	if err != nil {
		return nil, err
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return nil, ErrNotFound
	}

	return s.GetTask(ctx, id, userID)
}

// Category operations

func (s *Store) CreateCategory(ctx context.Context, c *models.Category) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO categories (id, user_id, name, created_at) VALUES (?, ?, ?, ?)`,
		c.ID, c.UserID, c.Name, c.CreatedAt,
	)
	if err != nil {
		if isUniqueConstraint(err) {
			return ErrConflict
		}
		return err
	}
	return nil
}

func (s *Store) GetCategory(ctx context.Context, id, userID string) (*models.Category, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, name, created_at FROM categories WHERE id=? AND user_id=?`, id, userID)
	c := &models.Category{}
	if err := row.Scan(&c.ID, &c.UserID, &c.Name, &c.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return c, nil
}

func (s *Store) ListCategories(ctx context.Context, userID string) ([]*models.Category, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, name, created_at FROM categories WHERE user_id=? ORDER BY name ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []*models.Category
	for rows.Next() {
		c := &models.Category{}
		if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.CreatedAt); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	if cats == nil {
		cats = []*models.Category{}
	}
	return cats, rows.Err()
}

func (s *Store) UpdateCategory(ctx context.Context, c *models.Category) error {
	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()
	result, err := s.db.ExecContext(ctx,
		`UPDATE categories SET name=? WHERE id=? AND user_id=?`,
		c.Name, c.ID, c.UserID,
	)
	if err != nil {
		if isUniqueConstraint(err) {
			return ErrConflict
		}
		return err
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) DeleteCategory(ctx context.Context, id, userID string) error {
	writeCtx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()

	tx, err := s.db.BeginTx(writeCtx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(writeCtx,
		`UPDATE tasks SET category_id=NULL WHERE category_id=? AND user_id=?`, id, userID); err != nil {
		return err
	}

	result, err := tx.ExecContext(writeCtx,
		`DELETE FROM categories WHERE id=? AND user_id=?`, id, userID)
	if err != nil {
		return err
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}

	return tx.Commit()
}

// Sentinel errors

var (
	ErrNotFound = fmt.Errorf("not found")
	ErrConflict = fmt.Errorf("conflict")
)

// Helpers

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func isUniqueConstraint(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed")
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanTask(r rowScanner) (*models.Task, error) {
	t := &models.Task{}
	var completed int
	var categoryID, dueDate, completedAt sql.NullString
	if err := r.Scan(
		&t.ID, &t.UserID, &t.Title, &t.Description,
		&categoryID, &dueDate, &completed, &completedAt,
		&t.CreatedAt, &t.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	t.Completed = completed != 0
	if categoryID.Valid {
		t.CategoryID = &categoryID.String
	}
	if dueDate.Valid {
		t.DueDate = &dueDate.String
	}
	if completedAt.Valid {
		t.CompletedAt = &completedAt.String
	}
	return t, nil
}

func scanTaskRow(r *sql.Rows) (*models.Task, error) {
	t := &models.Task{}
	var completed int
	var categoryID, dueDate, completedAt sql.NullString
	if err := r.Scan(
		&t.ID, &t.UserID, &t.Title, &t.Description,
		&categoryID, &dueDate, &completed, &completedAt,
		&t.CreatedAt, &t.UpdatedAt,
	); err != nil {
		return nil, err
	}
	t.Completed = completed != 0
	if categoryID.Valid {
		t.CategoryID = &categoryID.String
	}
	if dueDate.Valid {
		t.DueDate = &dueDate.String
	}
	if completedAt.Valid {
		t.CompletedAt = &completedAt.String
	}
	return t, nil
}
