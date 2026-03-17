package handler

import (
	"net/http"

	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rafidoth/onlyexams/internal/utils"
)

type QuestionHandler struct {
	svc *service.QuestionService
}

func NewQuestionHandler(svc *service.QuestionService) *QuestionHandler {
	return &QuestionHandler{svc: svc}
}

// CreateQuestion handles POST /questions/?set_id= — creates a single question in a set.
//
// @Summary      Create a question
// @Description  Creates a single question with choices and answer in the specified set
// @Tags         Questions
// @Accept       json
// @Param        set_id  query  string                                                              true  "Set ID to add the question to"
// @Param        body    body   object{question=model.Question,choices=[]model.Choice,answer=model.Answer}  true  "Question creation payload"
// @Success      200
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/questions/ [post]
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
//
// @Summary      Get all questions in a set
// @Description  Returns all questions with their choices and answers for the specified set
// @Tags         Questions
// @Produce      json
// @Param        set_id  query     string  true  "Set ID to retrieve questions from"
// @Success      200     {array}   model.QuestionResponse
// @Failure      400     {object}  errs.HTTPError
// @Failure      401     {object}  errs.HTTPError
// @Failure      500     {object}  errs.HTTPError
// @Router       /api/v1/questions/ [get]
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

	result := make([]model.QuestionResponse, len(questions))
	for i, qwa := range questions {
		result[i] = model.NewQuestionResponse(qwa)
	}

	writeJSON(w, http.StatusOK, result)
}
