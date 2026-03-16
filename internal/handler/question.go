package handler

import (
	"net/http"

	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
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
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "create question: missing user-id")
		return
	}

	setID := r.URL.Query().Get("set_id")
	if setID == "" {
		writeError(w, errs.NewBadRequestError("set_id is required", false, nil, nil, nil), "create question: missing set_id")
		return
	}

	var req struct {
		Question model.Question `json:"question"`
		Choices  []model.Choice `json:"choices"`
		Answer   model.Answer   `json:"answer"`
	}
	if !utils.ExtractRequestBody(r, &req) {
		writeError(w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "create question: decode body")
		return
	}

	if err := h.svc.CreateSingleQuestion(
		r.Context(), req.Question, req.Choices, req.Answer, setID,
	); err != nil {
		writeError(w, err, "create question failed")
		return
	}

	w.WriteHeader(http.StatusOK)
}

// GetAllQuestions handles GET /questions/?set_id= — returns all questions in a set.
func (h *QuestionHandler) GetAllQuestions(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "get questions: missing user-id")
		return
	}

	setID := r.URL.Query().Get("set_id")
	if setID == "" {
		writeError(w, errs.NewBadRequestError("set_id is required", false, nil, nil, nil), "get questions: missing set_id")
		return
	}

	questions, err := h.svc.GetAllQuestionsInASet(r.Context(), uid, setID)
	if err != nil {
		writeError(w, err, "get all questions failed")
		return
	}

	writeJSON(w, http.StatusOK, questions)
}
