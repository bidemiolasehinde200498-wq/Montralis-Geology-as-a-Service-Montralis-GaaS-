package main

import (
	"database/sql"
	"strings"

	_ "modernc.org/sqlite"
)

type User struct {
	ID           int64
	Email        string
	Name         string
	PasswordHash string
	ProfileTag   string
	Portal       string
	Title        string
}

const usersSchema = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    profile_tag TEXT NOT NULL,
    portal TEXT NOT NULL CHECK (portal IN ('client','staff')),
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`

func openDB(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(usersSchema); err != nil {
		return nil, err
	}
	return db, nil
}

func userByEmail(db *sql.DB, email string) (*User, error) {
	u := &User{}
	err := db.QueryRow(
		`SELECT id, email, name, password_hash, profile_tag, portal, title FROM users WHERE email = ?`,
		strings.ToLower(email),
	).Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.ProfileTag, &u.Portal, &u.Title)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func upsertUser(db *sql.DB, u User) error {
	_, err := db.Exec(
		`INSERT INTO users (email, name, password_hash, profile_tag, portal, title) VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(email) DO UPDATE SET name=excluded.name, password_hash=excluded.password_hash,
		 profile_tag=excluded.profile_tag, portal=excluded.portal, title=excluded.title`,
		strings.ToLower(u.Email), u.Name, u.PasswordHash, u.ProfileTag, u.Portal, u.Title,
	)
	return err
}
