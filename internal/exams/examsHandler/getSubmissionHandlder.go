package examsHandler

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/exams/models"
	"github.com/rafidoth/onlyexams/internal/utils"
)

type SubmissionResultResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    struct {
		Score       int                                   `json:"score"`
		AnswerSheet map[string]models.EvaluatedAnswerType `json:"answer_sheet"`
	} `json:"data"`
}

func (h *ExamsHandler) GetSubmissionResult(w http.ResponseWriter, r *http.Request) {
	slog.Info("GetSubmissionResult called")
	examId := chi.URLParam(r, "exam_id")
	if examId == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	userId, err := utils.ExtractUserId(r)
	if err != nil {
		http.Error(w, "Failed to extract user ID", http.StatusBadRequest)
		return
	}
	slog.Info("Fetching submission result", "exam_id", examId, "user_id", userId)

	score, answer_sheet, err := h.store.GetEvaluationResult(examId, userId)
	if err != nil {
		http.Error(w, "Failed to get evaluation result: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := &SubmissionResultResponse{
		Success: true,
		Message: "Evaluation result fetched successfully",
		Data: struct {
			Score       int                                   `json:"score"`
			AnswerSheet map[string]models.EvaluatedAnswerType `json:"answer_sheet"`
		}{
			Score:       score,
			AnswerSheet: answer_sheet,
		},
	}
	slog.Info("Submission result fetched", "response", fmt.Sprintf("%+v", response))
	utils.WriteJSON(w, http.StatusOK, response)
}
