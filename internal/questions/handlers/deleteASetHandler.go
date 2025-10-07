package handlers

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/questions/models"
)

type DeleteSetRes struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

func (h *Handler) DeleteASet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	set_id := chi.URLParam(r, "set_id")

	qSet := &models.Set{
		ID:     set_id,
		UserId: uid,
	}

	// deleting from sets table
	qSet, err = h.store.DeleteASet(qSet)
	if err != nil {
		slog.Warn("failed to delete set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// deleting the context
	err = h.store.DeleteSetContext(set_id)
	if err != nil {
		slog.Warn("failed to delete set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	res := &DeleteSetRes{
		ID:    set_id,
		Title: qSet.Title,
	}

	w.WriteHeader(http.StatusOK)
	if err := h.sendJson(w, res); err != nil {
		slog.Warn("failed json conversion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
