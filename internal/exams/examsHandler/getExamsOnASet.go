package examsHandler

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

func (eh *ExamsHandler) GetExamsOnASet(
	w http.ResponseWriter,
	r *http.Request,
) {

	setId := r.URL.Query().Get("set_id")
	if setId == "" {
		slog.Warn("set_id is required")
		http.Error(w, "set_id is required", http.StatusBadRequest)
		return
	}

	exams, err := eh.store.GetExamsBySetId(setId)
	if err != nil {
		slog.Error("failed to get exams on a set DB issue", "error", err)
		http.Error(
			w,
			"failed to get exams",
			http.StatusInternalServerError,
		)
		return
	}

	response, err := json.Marshal(exams)
	if err != nil {
		slog.Error("failed to marshal response", "error", err)
		http.Error(
			w,
			"Internal Server Error",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
	w.WriteHeader(http.StatusCreated)
}
