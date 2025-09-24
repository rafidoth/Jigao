package handlers

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/models"
)

type CreateSetReq struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
}

func (h *Handler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	var qSet CreateSetReq
	err = h.rcvJson(r, &qSet)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
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
		return
	}

	err = h.sendJson(w, QuestionSet)
	if err != nil {
		slog.Warn("failed to create new set json convertion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

}

// sets/{id}
func (h *Handler) GetASet(w http.ResponseWriter, r *http.Request) {

	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	set_id := chi.URLParam(r, "set_id")

	QuestionSet := &models.Set{
		ID:     set_id,
		UserId: uid,
	}

	QuestionSet, err = h.store.GetASet(QuestionSet)
	if err != nil {
		slog.Warn("failed to retrieve a Set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = h.sendJson(w, QuestionSet)
	if err != nil {
		slog.Warn("failed json convertion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

}
