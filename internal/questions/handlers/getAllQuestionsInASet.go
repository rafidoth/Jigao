package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

// GET /api/v1/questions?set_id=<id>
func (h *Handler) GetAllQuestionsInASet(w http.ResponseWriter, r *http.Request) {

	setId := r.URL.Query().Get("set_id")
	if setId == "" {
		http.Error(w, "Bad Request: set_id is required", http.StatusBadRequest)
		return
	}

	questions, err := h.store.GetAllQuestionsInASet(setId)
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
	fmt.Println(string(jsonRes))

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(jsonRes)
	if err != nil {
		slog.Warn("failed to write response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
