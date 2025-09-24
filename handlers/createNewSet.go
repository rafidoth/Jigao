package handlers

import (
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/models"
)

type CreateSetReq struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
}

func (h *Handler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	var qSet CreateSetReq
	err := h.rcvJson(r, &qSet)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}

	QuestionSet := &models.Set{
		Visibility: qSet.Visibility,
		Title:      qSet.Title,
		UserId:     uid,
	}

	QuestionSet, err = h.store.CreateNewSet(QuestionSet)
	if err != nil {
		slog.Warn("failed to create new Set DB issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}

	err = h.sendJson(w, QuestionSet)
	if err != nil {
		slog.Warn("failed to create new set json convertion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}

}
