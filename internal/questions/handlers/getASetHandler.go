package handlers

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/questions/models"
)

type response struct {
	ID         string `json:"id"`
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

func newResponse(id, visibility, title, context string) *response {
	return &response{
		ID:         id,
		Visibility: visibility,
		Title:      title,
		Context:    context,
	}
}

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

	setContext, err := h.store.GetSetContext(set_id)
	if err != nil {
		slog.Warn("failed to fetch Context of a Set", "set-id", set_id, "error", err)
	}

	set_ctx := ""
	if setContext != nil {
		set_ctx = setContext.Setcontext
	}
	res := newResponse(
		QuestionSet.ID,
		QuestionSet.Visibility,
		QuestionSet.Title,
		set_ctx,
	)

	w.WriteHeader(http.StatusOK)
	if err := h.sendJson(w, res); err != nil {
		slog.Warn("failed json conversion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

}
