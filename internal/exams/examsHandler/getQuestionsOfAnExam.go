package examsHandler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (eh ExamsHandler) GetQuestionsOfAnExam(
	w http.ResponseWriter,
	r *http.Request,
) {
	examId := chi.URLParam(r, "exam_id")
	if examId == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	set_id, err := eh.store.GetExamSetId(examId)
	if err != nil {
		http.Error(w, "set not found", http.StatusInternalServerError)
		return
	}

	questions, err := eh.qStore.GetAllQuestionsInASet(set_id)
	if err != nil {
		slog.Warn("failed to get all questions in a set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	jsonRes, err := json.Marshal(questions)
	if err != nil {
		slog.Warn("failed to marshal response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(jsonRes)
	if err != nil {
		slog.Warn("failed to write response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
