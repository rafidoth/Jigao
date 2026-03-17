package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/service"
)

// SubmissionHandler handles submission-related HTTP requests.
type SubmissionHandler struct {
	svc *service.ExamService
}

// NewSubmissionHandler creates a new SubmissionHandler.
func NewSubmissionHandler(svc *service.ExamService) *SubmissionHandler {
	return &SubmissionHandler{svc: svc}
}

// GetSubmissionResult handles GET /submissions/{exam_id} — returns evaluation result.
//
// @Summary      Get submission result
// @Description  Returns the evaluation result (score and answer sheet) for the authenticated user's submission to the specified exam
// @Tags         Submissions
// @Produce      json
// @Param        exam_id  path      string  true  "Exam ID"
// @Success      200      {object}  object{success=bool,message=string,data=object{score=int,answer_sheet=object,created_at=string}}
// @Failure      400      {object}  errs.HTTPError
// @Failure      401      {object}  errs.HTTPError
// @Failure      500      {object}  errs.HTTPError
// @Router       /api/v1/submissions/{exam_id} [get]
func (h *SubmissionHandler) GetSubmissionResult(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get submission: missing exam_id")
		return
	}

	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "get submission: missing user-id")
		return
	}

	result, err := h.svc.GetSubmissionResult(r.Context(), examID, uid)
	if err != nil {
		writeError(w, err, "get submission result failed")
		return
	}

	type respData struct {
		Score       int         `json:"score"`
		AnswerSheet interface{} `json:"answer_sheet"`
		CreatedAt   time.Time   `json:"created_at"`
	}
	type resp struct {
		Success bool     `json:"success"`
		Message string   `json:"message,omitempty"`
		Data    respData `json:"data"`
	}

	writeJSON(w, http.StatusOK, resp{
		Success: true,
		Message: "Evaluation result fetched successfully",
		Data: respData{
			Score:       result.Score,
			AnswerSheet: result.AnswerSheet,
			CreatedAt:   result.CreatedAt,
		},
	})
}
