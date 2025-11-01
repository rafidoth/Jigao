package questionsHandler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

type CreateSetReq struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
}

type CreateSetRes struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
}

func (h *Handler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)

	}

	QuestionSet := &questionsModels.Set{
		Visibility: "private",
		Title:      "untitled",
		UserId:     uid,
	}

	set, err := h.store.CreateNewSet(QuestionSet)
	if err != nil {
		slog.Warn("failed to create new Set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	jsonRes, err := json.Marshal(&set)
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
