package questionsHandler

import (
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

type CreateSetReq struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

type CreateSetRes struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

func (h *Handler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)

	}

	var req CreateSetReq
	err = h.rcvJson(r, &req)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	QuestionSet := &questionsModels.Set{
		Visibility: req.Visibility,
		Title:      req.Title,
		UserId:     uid,
	}

	err = h.store.CreateSetWithContext(QuestionSet, req.Context)
	if err != nil {
		slog.Warn("failed to create new Set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
