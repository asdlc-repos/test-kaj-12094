package main

import (
	"log"
	"net/http"
	"os"

	"github.com/kaje94/todo-api/handlers"
	"github.com/kaje94/todo-api/middleware"
	"github.com/kaje94/todo-api/store"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "/data/todo.db"
	}

	db, err := store.Open(dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	authH := handlers.NewAuthHandler(db)
	taskH := handlers.NewTaskHandler(db)
	catH := handlers.NewCategoryHandler(db)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("POST /auth/register", authH.Register)
	mux.HandleFunc("POST /auth/login", authH.Login)
	mux.HandleFunc("POST /auth/logout", middleware.RequireAuth(db, authH.Logout))

	mux.HandleFunc("GET /tasks", middleware.RequireAuth(db, taskH.List))
	mux.HandleFunc("POST /tasks", middleware.RequireAuth(db, taskH.Create))
	mux.HandleFunc("GET /tasks/{id}", middleware.RequireAuth(db, taskH.Get))
	mux.HandleFunc("PUT /tasks/{id}", middleware.RequireAuth(db, taskH.Update))
	mux.HandleFunc("DELETE /tasks/{id}", middleware.RequireAuth(db, taskH.Delete))
	mux.HandleFunc("PATCH /tasks/{id}/toggle", middleware.RequireAuth(db, taskH.Toggle))

	mux.HandleFunc("GET /categories", middleware.RequireAuth(db, catH.List))
	mux.HandleFunc("POST /categories", middleware.RequireAuth(db, catH.Create))
	mux.HandleFunc("PUT /categories/{id}", middleware.RequireAuth(db, catH.Update))
	mux.HandleFunc("DELETE /categories/{id}", middleware.RequireAuth(db, catH.Delete))

	handler := middleware.CORS(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "9090"
	}

	log.Printf("starting server on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
