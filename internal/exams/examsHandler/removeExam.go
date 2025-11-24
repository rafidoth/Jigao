package examsHandler

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// RemoveExam handles DELETE /exams/{exam_id}
func (eh *ExamsHandler) RemoveExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	if err := eh.store.RemoveExam(examID); err != nil {
		if err.Error() == "exam not found" {
			http.Error(w, "Exam not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to remove exam", "exam_id", examID, "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
