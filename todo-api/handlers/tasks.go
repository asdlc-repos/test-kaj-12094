package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kaje94/todo-api/models"
	"github.com/kaje94/todo-api/store"
)

type TaskHandler struct {
	store *store.Store
}

func NewTaskHandler(s *store.Store) *TaskHandler {
	return &TaskHandler{store: s}
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	q := r.URL.Query()
	filters := models.TaskFilters{
		Status:     q.Get("status"),
		CategoryID: q.Get("category_id"),
		DueFrom:    q.Get("due_from"),
		DueTo:      q.Get("due_to"),
	}

	tasks, err := h.store.ListTasks(r.Context(), userID, filters)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var body struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		CategoryID  *string `json:"category_id"`
		DueDate     *string `json:"due_date"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	body.Title = strings.TrimSpace(body.Title)
	if body.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}
	if len(body.Title) > 200 {
		writeError(w, http.StatusBadRequest, "title must not exceed 200 characters")
		return
	}

	body.Description = strings.TrimSpace(body.Description)
	if len(body.Description) > 2000 {
		writeError(w, http.StatusBadRequest, "description must not exceed 2000 characters")
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	t := &models.Task{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       body.Title,
		Description: body.Description,
		CategoryID:  body.CategoryID,
		DueDate:     body.DueDate,
		Completed:   false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := h.store.CreateTask(r.Context(), t); err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (h *TaskHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	id := r.PathValue("id")

	t, err := h.store.GetTask(r.Context(), id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	id := r.PathValue("id")

	existing, err := h.store.GetTask(r.Context(), id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if existing == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}

	var body struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		CategoryID  *string `json:"category_id"`
		DueDate     *string `json:"due_date"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	body.Title = strings.TrimSpace(body.Title)
	if body.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}
	if len(body.Title) > 200 {
		writeError(w, http.StatusBadRequest, "title must not exceed 200 characters")
		return
	}
	body.Description = strings.TrimSpace(body.Description)
	if len(body.Description) > 2000 {
		writeError(w, http.StatusBadRequest, "description must not exceed 2000 characters")
		return
	}

	existing.Title = body.Title
	existing.Description = body.Description
	existing.CategoryID = body.CategoryID
	existing.DueDate = body.DueDate
	existing.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := h.store.UpdateTask(r.Context(), existing); err != nil {
		if err == store.ErrNotFound {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, existing)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	id := r.PathValue("id")

	if err := h.store.DeleteTask(r.Context(), id, userID); err != nil {
		if err == store.ErrNotFound {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TaskHandler) Toggle(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	id := r.PathValue("id")

	t, err := h.store.ToggleTask(r.Context(), id, userID)
	if err != nil {
		if err == store.ErrNotFound {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, t)
}
