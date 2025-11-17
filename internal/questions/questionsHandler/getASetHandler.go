package questionsHandler

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
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
	userId, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	setId := chi.URLParam(r, "set_id")

	vis, err := h.store.GetVisibility(setId)
	if err != nil {
		slog.Warn("failed to get visibility", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	var QuestionSet *questionsModels.Set

	if vis == "private" {
		ownerUserId, err := h.store.GetOwnerUserId(setId)
		if err != nil {
			slog.Warn("failed to get owner user id", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		if userId != ownerUserId {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		QuestionSet = &questionsModels.Set{
			ID:     setId,
			UserId: userId,
		}
	} else if vis == "restricted" {
		ownerUserId, err := h.store.GetOwnerUserId(setId)
		if err != nil {
			slog.Warn("failed to get owner user id", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		access, err := h.store.CheckUserAccess(userId, setId)
		if err != nil {
			slog.Warn("failed to check user access", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if !access && userId != ownerUserId {
			slog.Info("Not matched with owner and also not matched with shared access users.")
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		QuestionSet = &questionsModels.Set{
			ID:     setId,
			UserId: ownerUserId,
		}
	}

	QuestionSet, err = h.store.GetASet(QuestionSet)
	if err != nil {
		slog.Warn("failed to retrieve a Set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	setContext, err := h.store.GetSetContext(setId)
	if err != nil {
		slog.Warn("failed to fetch Context of a Set", "set-id", setId, "error", err)
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
