package handlers

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/models"
)

type UpdateSetReq struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

type UpdateSetRes struct {
	ID         string `json:"id"`
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

// UpdateASet updates visibility and title for a set owned by the user.
func (h *Handler) UpdateASet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	set_id := chi.URLParam(r, "set_id")

	var req UpdateSetReq
	if err := h.rcvJson(r, &req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	qSet := &models.Set{
		ID:         set_id,
		Visibility: req.Visibility,
		Title:      req.Title,
		UserId:     uid,
	}

	qSet, err = h.store.UpdateASet(qSet)
	if err != nil {
		slog.Warn("failed to update set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	updatedCtx, err := h.store.UpdateSetContext(set_id, req.Context)
	if err != nil {
		slog.Warn("failed to update context DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	res := &UpdateSetRes{
		ID:         qSet.ID,
		Visibility: qSet.Visibility,
		Title:      qSet.Title,
		Context:    updatedCtx.Setcontext,
	}

	w.WriteHeader(http.StatusOK)
	if err := h.sendJson(w, res); err != nil {
		slog.Warn("failed json conversion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
