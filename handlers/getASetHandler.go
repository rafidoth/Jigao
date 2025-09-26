package handlers

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/models"
)

type GetASetRes struct {
	ID         string
	Visibility string
	Title      string
	Context    string
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
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	res := &GetASetRes{
		ID:         QuestionSet.ID,
		Visibility: QuestionSet.Visibility,
		Title:      QuestionSet.Title,
		Context:    setContext.Setcontext,
	}

	w.WriteHeader(http.StatusOK)
	err = h.sendJson(w, res)
	if err != nil {
		slog.Warn("failed json convertion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

}
