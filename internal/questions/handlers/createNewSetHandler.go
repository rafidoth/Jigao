package handlers

import (
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/questions/models"
)

type CreateSetReq struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

type CreateSetRes struct {
	ID         string `json:"id"`
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

func (h *Handler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	var req CreateSetReq
	err = h.rcvJson(r, &req)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	QuestionSet := &models.Set{
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
