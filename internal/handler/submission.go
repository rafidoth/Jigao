package handler

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
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
func (h *SubmissionHandler) GetSubmissionResult(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	result, err := h.svc.GetSubmissionResult(r.Context(), examID, uid)
	if err != nil {
		slog.Error("get submission result failed", "error", err)
		http.Error(w, "Failed to get evaluation result: "+err.Error(), http.StatusInternalServerError)
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
