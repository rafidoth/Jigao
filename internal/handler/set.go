package handler

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rafidoth/onlyexams/internal/utils"
)

// SetHandler handles set-related HTTP requests.
type SetHandler struct {
	svc *service.QuestionService
}

// NewSetHandler creates a new SetHandler.
func NewSetHandler(svc *service.QuestionService) *SetHandler {
	return &SetHandler{svc: svc}
}

// CreateNewSet handles POST /sets/ — creates a new empty set.
func (h *SetHandler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	set, err := h.svc.CreateNewSet(r.Context(), uid)
	if err != nil {
		slog.Warn("create new set failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, set)
}

// GetASet handles GET /sets/{set_id} — returns a set with its context.
func (h *SetHandler) GetASet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	setID := chi.URLParam(r, "set_id")

	set, setCtx, err := h.svc.GetSetWithContext(r.Context(), uid, setID)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		slog.Warn("get set failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	type resp struct {
		ID         string `json:"id"`
		Visibility string `json:"visibility"`
		Title      string `json:"title"`
		Context    string `json:"context"`
	}

	writeJSON(w, http.StatusOK, resp{
		ID:         set.ID,
		Visibility: set.Visibility,
		Title:      set.Title,
		Context:    setCtx,
	})
}

// UpdateASet handles PUT /sets/{set_id} — updates a set's visibility and title.
func (h *SetHandler) UpdateASet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	setID := chi.URLParam(r, "set_id")

	type reqBody struct {
		Visibility string `json:"visibility"`
		Title      string `json:"title"`
	}

	var req reqBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if _, err := h.svc.UpdateSet(r.Context(), uid, setID, req.Visibility, req.Title); err != nil {
		slog.Warn("update set failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteASet handles DELETE /sets/{set_id} — deletes a set and its context.
func (h *SetHandler) DeleteASet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	setID := chi.URLParam(r, "set_id")

	deleted, err := h.svc.DeleteSetWithContext(r.Context(), uid, setID)
	if err != nil {
		slog.Warn("delete set failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	type resp struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	}
	writeJSON(w, http.StatusOK, resp{ID: setID, Title: deleted.Title})
}

// GetRecentSets handles GET /sets/?recent=N — returns recent sets with owner info.
func (h *SetHandler) GetRecentSets(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	limitStr := r.URL.Query().Get("recent")
	if limitStr == "" {
		http.Error(w, "Bad Request: limit not found", http.StatusBadRequest)
		return
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		http.Error(w, "Bad Request: limit must be an integer", http.StatusBadRequest)
		return
	}

	results, err := h.svc.GetRecentSetsWithOwners(r.Context(), uid, limit)
	if err != nil {
		slog.Error("get recent sets failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, results)
}

// GetSetAccessList handles GET /sets/access_list/{set_id} — returns owner + shared users.
func (h *SetHandler) GetSetAccessList(w http.ResponseWriter, r *http.Request) {
	setID := chi.URLParam(r, "set_id")
	if setID == "" {
		http.Error(w, "set_id is required", http.StatusBadRequest)
		return
	}

	userList, err := h.svc.GetSetAccessList(r.Context(), setID)
	if err != nil {
		slog.Error("get access list failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, userList)
}

// AllowSetAccess handles POST /sets/access — grants a user shared access to a set.
func (h *SetHandler) AllowSetAccess(w http.ResponseWriter, r *http.Request) {
	type reqBody struct {
		UserID string `json:"user_id"`
		SetID  string `json:"set_id"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if err := h.svc.AllowSetAccess(r.Context(), req.SetID, req.UserID); err != nil {
		slog.Error("allow set access failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// GenerateQuestionSet handles POST /sets/gen — calls AI to generate a question set.
func (h *SetHandler) GenerateQuestionSet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	type reqBody struct {
		NumQuestions int    `json:"n"`
		SetContext   string `json:"context"`
		QuestionType string `json:"type"`
	}

	var req reqBody
	if !utils.ExtractRequestBody(r, &req) {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	setID, err := h.svc.GenerateQuestionSet(
		r.Context(), uid, req.NumQuestions, req.SetContext, req.QuestionType,
	)
	if err != nil {
		slog.Error("generate question set failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	type resp struct {
		SetID string `json:"set_id"`
	}
	writeJSON(w, http.StatusOK, resp{SetID: setID})
}

// SaveGeneratedQuestions handles POST /sets/save_generated — saves pre-generated questions.
func (h *SetHandler) SaveGeneratedQuestions(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	type reqBody struct {
		Title     string                           `json:"title"`
		Questions []service.GeneratedQuestionInput `json:"questions"`
		Context   string                           `json:"context"`
	}

	var req reqBody
	if !utils.ExtractRequestBody(r, &req) {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	setID, err := h.svc.SaveGeneratedQuestions(
		r.Context(), uid, req.Title, req.Context, req.Questions,
	)
	if err != nil {
		slog.Error("save generated questions failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	type resp struct {
		SetID string `json:"set_id"`
	}
	writeJSON(w, http.StatusOK, resp{SetID: setID})
}
