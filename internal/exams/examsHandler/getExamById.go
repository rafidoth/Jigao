package examsHandler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (eh *ExamsHandler) GetExamById(w http.ResponseWriter, r *http.Request) {
	exam_id := chi.URLParam(r, "exam_id")
	fmt.Println(exam_id)
	if exam_id == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	xm, err := eh.store.GetExamByExamId(exam_id)
	if err != nil {
		slog.Error("Failed to get Exam details.", "exam id", exam_id)
		http.Error(w, "Internal Issue", http.StatusInternalServerError)
		return
	}

	jsonRes, err := json.Marshal(xm)
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
