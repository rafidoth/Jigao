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
// @Param        body  body  object{set_id=string,visibility=string,title=string,description=string,start_time=string,duration_in_minutes=int,start_mode=string,proctoring_enabled=bool,camera_required=bool}  true  "Exam creation payload (start_time in RFC3339 format)"
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

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Failed to read request body", false, nil, nil, nil), "create exam: read body")
		return
	}

	type createExamReq struct {
		SetID             string    `json:"set_id"`
		Visibility        *string   `json:"visibility"`
		Title             string    `json:"title"`
		Description       string    `json:"description"`
		StartTime         time.Time `json:"start_time"`
		DurationInMinutes int       `json:"duration_in_minutes"`
		StartMode         string    `json:"start_mode"`
		ProctoringEnabled bool      `json:"proctoring_enabled"`
		CameraRequired    bool      `json:"camera_required"`
	}

	var req createExamReq
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "create exam: unmarshal body")
		return
	}
	if req.Visibility == nil {
		writeError(h.log, w, errs.NewBadRequestError("visibility is required", false, nil, nil, nil), "create exam: missing visibility")
		return
	}

	create := model.ExamCreate{
		SetID:             req.SetID,
		Visibility:        *req.Visibility,
		Title:             req.Title,
		Description:       req.Description,
		StartTime:         req.StartTime,
		DurationInMinutes: req.DurationInMinutes,
		StartMode:         req.StartMode,
		ProctoringEnabled: req.ProctoringEnabled,
		CameraRequired:    req.CameraRequired,
	}

	create.UserID = uid

	if err := h.svc.CreateExam(r.Context(), &create); err != nil {
		writeError(h.log, w, err, "create exam failed")
		return
	}

	w.WriteHeader(http.StatusCreated)
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

	var update model.ExamUpdate
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "update exam: decode body")
		return
	}

	update.ID = examID
	update.UserID = uid

	if err := h.svc.UpdateExam(r.Context(), &update); err != nil {
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
