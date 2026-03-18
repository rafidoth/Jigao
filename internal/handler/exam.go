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
	"github.com/rs/zerolog"
)

// ExamHandler handles exam-related HTTP requests.
type ExamHandler struct {
	svc *service.ExamService
	log zerolog.Logger
}

// NewExamHandler creates a new ExamHandler.
func NewExamHandler(svc *service.ExamService, log zerolog.Logger) *ExamHandler {
	return &ExamHandler{svc: svc, log: log}
}

// @Summary      Create an exam
// @Description  Creates a new exam from a question set
// @Tags         Exams
// @Accept       json
// @Param        body  body  object{set_id=string,title=string,description=string,start_time=string,duration_in_minutes=int,start_mode=string,proctoring_enabled=bool,camera_required=bool}  true  "Exam creation payload (start_time in RFC3339 format)"
// @Success      201
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/exams/ [post]
func (h *ExamHandler) CreateExam(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "create exam: missing user-id")
		return
	}

	type reqBody struct {
		SetID             string    `json:"set_id"`
		Title             string    `json:"title"`
		Description       string    `json:"description"`
		StartTime         time.Time `json:"start_time"`
		DurationInMinutes int       `json:"duration_in_minutes"`
		StartMode         string    `json:"start_mode"`
		ProctoringEnabled bool      `json:"proctoring_enabled"`
		CameraRequired    bool      `json:"camera_required"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Failed to read request body", false, nil, nil, nil), "create exam: read body")
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "create exam: unmarshal body")
		return
	}

	if err := h.svc.CreateExam(
		r.Context(), uid, req.SetID, req.Title, req.Description,
		req.StartTime, req.DurationInMinutes,
		req.StartMode,
		req.ProctoringEnabled, req.CameraRequired,
	); err != nil {
		writeError(h.log, w, err, "create exam failed")
		return
	}

	w.WriteHeader(http.StatusCreated)
}

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
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "get exams: missing user-id")
		return
	}

	setID := r.URL.Query().Get("set_id")
	examsList, err := h.svc.GetExams(r.Context(), uid, setID)
	if err != nil {
		writeError(h.log, w, err, "get exams failed")
		return
	}

	writeJSON(h.log, w, http.StatusOK, examsList)
}

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
		writeError(h.log, w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam: missing exam_id")
		errs.NewBadRequestError("Exam Id Required", false, nil, nil, nil)
		return
	}

	exam, err := h.svc.GetExamByID(r.Context(), examID)
	if err != nil {
		writeError(h.log, w, err, "get exam by id failed")
		return
	}

	writeJSON(h.log, w, http.StatusOK, exam)
}

// @Summary      Update an exam
// @Description  Updates editable fields of an existing exam
// @Tags         Exams
// @Accept       json
// @Param        exam_id  path  string  true  "Exam ID"
// @Param        body  body  object{title=string,description=string,start_time=string,duration_in_minutes=int,start_mode=string,session_status=string,proctoring_enabled=bool,camera_required=bool,max_violations=int}  true  "Exam update payload"
// @Success      200
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/exams/{exam_id} [put]
func (h *ExamHandler) UpdateExam(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "update exam: missing user-id")
		return
	}

	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(h.log, w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "update exam: missing exam_id")
		return
	}

	type reqBody struct {
		Title             *string    `json:"title"`
		Description       *string    `json:"description"`
		StartTime         *time.Time `json:"start_time"`
		DurationInMinutes *int       `json:"duration_in_minutes"`
		StartMode         *string    `json:"start_mode"`
		SessionStatus     *string    `json:"session_status"`
		ProctoringEnabled *bool      `json:"proctoring_enabled"`
		CameraRequired    *bool      `json:"camera_required"`
		MaxViolations     *int       `json:"max_violations"`
	}

	var req reqBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "update exam: decode body")
		return
	}

	update := &model.ExamUpdate{
		ID:                examID,
		UserID:            uid,
		Title:             req.Title,
		Description:       req.Description,
		StartTime:         req.StartTime,
		DurationInMinutes: req.DurationInMinutes,
		StartMode:         req.StartMode,
		SessionStatus:     req.SessionStatus,
		ProctoringEnabled: req.ProctoringEnabled,
		CameraRequired:    req.CameraRequired,
		MaxViolations:     req.MaxViolations,
	}

	if err := h.svc.UpdateExam(r.Context(), update); err != nil {
		writeError(h.log, w, err, "update exam failed")
		return
	}

	w.WriteHeader(http.StatusOK)
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
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "remove exam: missing user-id")
		return
	}

	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(h.log, w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "remove exam: missing exam_id")
		return
	}

	if err := h.svc.RemoveExam(r.Context(), uid, examID); err != nil {
		writeError(h.log, w, err, "remove exam failed")
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
		writeError(h.log, w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam questions: missing exam_id")
		return
	}

	questions, err := h.svc.GetQuestionsOfExam(r.Context(), examID)
	if err != nil {
		writeError(h.log, w, err, "get questions of exam failed")
		return
	}

	result := make([]model.QuestionResponse, len(questions))
	for i, qwa := range questions {
		result[i] = model.NewQuestionResponse(qwa)
	}

	writeJSON(h.log, w, http.StatusOK, result)
}
