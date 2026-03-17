package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/service"
)

// ExamHandler handles exam-related HTTP requests.
type ExamHandler struct {
	svc *service.ExamService
}

// NewExamHandler creates a new ExamHandler.
func NewExamHandler(svc *service.ExamService) *ExamHandler {
	return &ExamHandler{svc: svc}
}

// CreateExam handles POST /exams/ — validates and creates an exam.
//
// @Summary      Create an exam
// @Description  Validates input and creates a new exam from a question set
// @Tags         Exams
// @Accept       json
// @Param        body  body  object{set_id=string,title=string,description=string,start_time=string,duration_in_minutes=int}  true  "Exam creation payload (start_time in RFC3339 format)"
// @Success      201
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/exams/ [post]
func (h *ExamHandler) CreateExam(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "create exam: missing user-id")
		return
	}

	type reqBody struct {
		SetID             string    `json:"set_id"`
		Title             string    `json:"title"`
		Description       string    `json:"description"`
		StartTime         time.Time `json:"start_time"`
		DurationInMinutes int       `json:"duration_in_minutes"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, errs.NewBadRequestError("Failed to read request body", false, nil, nil, nil), "create exam: read body")
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "create exam: unmarshal body")
		return
	}

	if err := h.svc.CreateExam(
		r.Context(), uid, req.SetID, req.Title, req.Description,
		req.StartTime, req.DurationInMinutes,
	); err != nil {
		writeError(w, err, "create exam failed")
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// GetExams handles GET /exams/?set_id= — returns exams filtered by set_id or user.
//
// @Summary      List exams
// @Description  Returns exams filtered by set_id (if provided) or all exams for the authenticated user
// @Tags         Exams
// @Produce      json
// @Param        set_id  query     string  false  "Optional set ID to filter exams"
// @Success      200     {array}   model.Exam
// @Failure      400     {object}  errs.HTTPError
// @Failure      401     {object}  errs.HTTPError
// @Failure      500     {object}  errs.HTTPError
// @Router       /api/v1/exams/ [get]
func (h *ExamHandler) GetExams(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "get exams: missing user-id")
		return
	}

	setID := r.URL.Query().Get("set_id")
	examsList, err := h.svc.GetExams(r.Context(), uid, setID)
	if err != nil {
		writeError(w, err, "get exams failed")
		return
	}

	writeJSON(w, http.StatusOK, examsList)
}

// GetExamByID handles GET /exams/{exam_id} — returns a single exam.
//
// @Summary      Get an exam by ID
// @Description  Returns a single exam by its ID
// @Tags         Exams
// @Produce      json
// @Param        exam_id  path      string  true  "Exam ID"
// @Success      200      {object}  model.Exam
// @Failure      400      {object}  errs.HTTPError
// @Failure      401      {object}  errs.HTTPError
// @Failure      500      {object}  errs.HTTPError
// @Router       /api/v1/exams/{exam_id} [get]
func (h *ExamHandler) GetExamByID(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam: missing exam_id")
		return
	}

	exam, err := h.svc.GetExamByID(r.Context(), examID)
	if err != nil {
		writeError(w, err, "get exam by id failed")
		return
	}

	writeJSON(w, http.StatusOK, exam)
}

// RemoveExam handles DELETE /exams/{exam_id} — deletes an exam.
//
// @Summary      Delete an exam
// @Description  Deletes an exam by its ID
// @Tags         Exams
// @Param        exam_id  path  string  true  "Exam ID"
// @Success      204
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/exams/{exam_id} [delete]
func (h *ExamHandler) RemoveExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "remove exam: missing exam_id")
		return
	}

	if err := h.svc.RemoveExam(r.Context(), examID); err != nil {
		writeError(w, err, "remove exam failed")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetQuestionsOfExam handles GET /exams/q/{exam_id} — returns all questions for an exam.
//
// @Summary      Get questions of an exam
// @Description  Returns all questions with choices and answers for the specified exam
// @Tags         Exams
// @Produce      json
// @Param        exam_id  path      string  true  "Exam ID"
// @Success      200      {array}   model.QuestionResponse
// @Failure      400      {object}  errs.HTTPError
// @Failure      401      {object}  errs.HTTPError
// @Failure      500      {object}  errs.HTTPError
// @Router       /api/v1/exams/q/{exam_id} [get]
func (h *ExamHandler) GetQuestionsOfExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam questions: missing exam_id")
		return
	}

	questions, err := h.svc.GetQuestionsOfExam(r.Context(), examID)
	if err != nil {
		writeError(w, err, "get questions of exam failed")
		return
	}

	result := make([]model.QuestionResponse, len(questions))
	for i, qwa := range questions {
		result[i] = model.NewQuestionResponse(qwa)
	}

	writeJSON(w, http.StatusOK, result)
}
