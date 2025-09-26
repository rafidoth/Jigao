package handlers

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/models"
)

// DeleteASet deletes a set owned by the user.
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

	qSet, err = h.store.DeleteASet(qSet)
	if err != nil {
		slog.Warn("failed to delete set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	if err := h.sendJson(w, qSet); err != nil {
		slog.Warn("failed json conversion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
