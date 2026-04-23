package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kaje94/todo-api/models"
	"github.com/kaje94/todo-api/store"
)

type CategoryHandler struct {
	store *store.Store
}

func NewCategoryHandler(s *store.Store) *CategoryHandler {
	return &CategoryHandler{store: s}
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	cats, err := h.store.ListCategories(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, cats)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var body struct {
		Name string `json:"name"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	if body.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	c := &models.Category{
		ID:        uuid.New().String(),
		UserID:    userID,
		Name:      body.Name,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	if err := h.store.CreateCategory(r.Context(), c); err != nil {
		if err == store.ErrConflict {
			writeError(w, http.StatusConflict, "category name already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	id := r.PathValue("id")

	existing, err := h.store.GetCategory(r.Context(), id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if existing == nil {
		writeError(w, http.StatusNotFound, "category not found")
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	if body.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	existing.Name = body.Name
	if err := h.store.UpdateCategory(r.Context(), existing); err != nil {
		if err == store.ErrConflict {
			writeError(w, http.StatusConflict, "category name already taken")
			return
		}
		if err == store.ErrNotFound {
			writeError(w, http.StatusNotFound, "category not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, existing)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	id := r.PathValue("id")

	if err := h.store.DeleteCategory(r.Context(), id, userID); err != nil {
		if err == store.ErrNotFound {
			writeError(w, http.StatusNotFound, "category not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
