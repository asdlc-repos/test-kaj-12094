package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/kaje94/todo-api/store"
)

type contextKey string

const UserIDKey contextKey = "userID"

func RequireAuth(s *store.Store, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "missing or invalid authorization header")
			return
		}

		token := strings.TrimPrefix(auth, "Bearer ")
		sess, err := s.GetSession(r.Context(), token)
		if err != nil || sess == nil {
			writeError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		exp, err := time.Parse(time.RFC3339, sess.ExpiresAt)
		if err != nil || exp.Before(time.Now()) {
			writeError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, sess.UserID)
		next(w, r.WithContext(ctx))
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
