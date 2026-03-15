package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rafidoth/onlyexams/internal/utils"
)

// QuestionHandler handles question-related HTTP requests.
type QuestionHandler struct {
	svc *service.QuestionService
}

// NewQuestionHandler creates a new QuestionHandler.
func NewQuestionHandler(svc *service.QuestionService) *QuestionHandler {
	return &QuestionHandler{svc: svc}
}

// CreateQuestion handles POST /questions/?set_id= — creates a single question in a set.
func (h *QuestionHandler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	_, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	setID := r.URL.Query().Get("set_id")
	if setID == "" {
		http.Error(w, "Bad Request: set_id is required", http.StatusBadRequest)
		return
	}

	var req struct {
		Question questionsModels.Question `json:"question"`
		Choices  []questionsModels.Choice `json:"choices"`
		Answer   questionsModels.Answer   `json:"answer"`
	}
	if !utils.ExtractRequestBody(r, &req) {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if err := h.svc.CreateSingleQuestion(
		r.Context(), req.Question, req.Choices, req.Answer, setID,
	); err != nil {
		slog.Warn("create question failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// GetAllQuestions handles GET /questions/?set_id= — returns all questions in a set.
func (h *QuestionHandler) GetAllQuestions(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	setID := r.URL.Query().Get("set_id")
	if setID == "" {
		http.Error(w, "Bad Request: set_id is required", http.StatusBadRequest)
		return
	}

	questions, err := h.svc.GetAllQuestionsInASet(r.Context(), uid, setID)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		slog.Warn("get all questions failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, questions)
}
