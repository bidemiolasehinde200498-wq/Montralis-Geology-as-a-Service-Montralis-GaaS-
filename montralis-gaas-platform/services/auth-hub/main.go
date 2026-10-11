package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const (
	cookieName      = "mtrl_session"
	sessionLifetime = 8 * time.Hour
	maxFailures     = 5
	lockoutWindow   = 15 * time.Minute
	minPasswordLen  = 12
)

var (
	jwtSecret    []byte
	secureCookie = os.Getenv("MONTRALIS_COOKIE_SECURE") == "true"
	dummyHash    []byte
	attemptsMu   sync.Mutex
	failedLogins = map[string][]time.Time{}
	validPortals = map[string]bool{"client": true, "staff": true}
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Portal   string `json:"portal"`
}

type userView struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Title   string `json:"title"`
	Role    string `json:"role"`
	Portal  string `json:"portal"`
	Expires int64  `json:"expires_at"`
}

func isLocked(key string) bool {
	attemptsMu.Lock()
	defer attemptsMu.Unlock()
	cutoff := time.Now().Add(-lockoutWindow)
	recent := failedLogins[key][:0]
	for _, t := range failedLogins[key] {
		if t.After(cutoff) {
			recent = append(recent, t)
		}
	}
	failedLogins[key] = recent
	return len(recent) >= maxFailures
}

func recordFailure(key string) {
	attemptsMu.Lock()
	defer attemptsMu.Unlock()
	failedLogins[key] = append(failedLogins[key], time.Now())
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func setSessionCookie(w http.ResponseWriter, value string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    value,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secureCookie,
		SameSite: http.SameSiteStrictMode,
	})
}

func loginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<14)
		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !validPortals[req.Portal] {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(req.Email))
		key := clientIP(r) + "|" + email
		if isLocked(key) {
			writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "too many attempts, try again later"})
			return
		}

		user, err := userByEmail(db, email)
		hash := dummyHash
		if err == nil {
			hash = []byte(user.PasswordHash)
		}
		// Always run bcrypt so unknown accounts cost the same as wrong passwords.
		pwErr := bcrypt.CompareHashAndPassword(hash, []byte(req.Password))
		if err != nil || pwErr != nil || user.Portal != req.Portal {
			recordFailure(key)
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
			return
		}

		now := time.Now()
		claims := Claims{
			Sub: user.ID, Email: user.Email, Name: user.Name, Title: user.Title,
			Role: user.ProfileTag, Portal: user.Portal,
			Iat: now.Unix(), Exp: now.Add(sessionLifetime).Unix(),
		}
		setSessionCookie(w, signToken(claims, jwtSecret), int(sessionLifetime.Seconds()))
		writeJSON(w, http.StatusOK, claimsView(&claims))
	}
}

func claimsView(c *Claims) userView {
	return userView{Email: c.Email, Name: c.Name, Title: c.Title, Role: c.Role, Portal: c.Portal, Expires: c.Exp}
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(cookieName)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}
	claims, err := verifyToken(cookie.Value, jwtSecret)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}
	writeJSON(w, http.StatusOK, claimsView(claims))
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	setSessionCookie(w, "", -1)
	writeJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
}

func loadSecret() []byte {
	s := os.Getenv("MONTRALIS_JWT_SECRET")
	if len(s) < 32 {
		log.Fatal("MONTRALIS_JWT_SECRET must be set to at least 32 characters")
	}
	return []byte(s)
}

func dbPath() string {
	if p := os.Getenv("MONTRALIS_DB_PATH"); p != "" {
		return p
	}
	return filepath.Join("..", "..", "packages", "database", "montralis_vault.db")
}

// seedUser reads the password from MONTRALIS_SEED_PASSWORD to keep it out of shell history.
func seedUser(db *sql.DB, args []string) {
	if len(args) != 5 {
		log.Fatal("usage: seed-user <email> <name> <profile_tag> <portal> <title>  (password in MONTRALIS_SEED_PASSWORD)")
	}
	pw := os.Getenv("MONTRALIS_SEED_PASSWORD")
	if len(pw) < minPasswordLen {
		log.Fatalf("MONTRALIS_SEED_PASSWORD must be at least %d characters", minPasswordLen)
	}
	if !validPortals[args[3]] {
		log.Fatal("portal must be 'client' or 'staff'")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	if err != nil {
		log.Fatal(err)
	}
	if err := upsertUser(db, User{
		Email: args[0], Name: args[1], PasswordHash: string(hash),
		ProfileTag: args[2], Portal: args[3], Title: args[4],
	}); err != nil {
		log.Fatal(err)
	}
	fmt.Println("user saved:", strings.ToLower(args[0]))
}

func main() {
	jwtSecret = loadSecret()
	random := make([]byte, 32)
	if _, err := rand.Read(random); err != nil {
		log.Fatal(err)
	}
	dummyHash, _ = bcrypt.GenerateFromPassword(random, 12)

	db, err := openDB(dbPath())
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if len(os.Args) > 1 && os.Args[1] == "seed-user" {
		seedUser(db, os.Args[2:])
		return
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/auth/login", loginHandler(db))
	mux.HandleFunc("/api/v1/auth/me", meHandler)
	mux.HandleFunc("/api/v1/auth/logout", logoutHandler)
	mux.HandleFunc("/api/v1/auth/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	srv := &http.Server{
		Addr:              "127.0.0.1:8050",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
	}
	log.Fatal(srv.ListenAndServe())
}
