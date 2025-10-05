package handlers

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// api/v1/sets/{set_id}/context
func (h *Handler) GetSetContext(w http.ResponseWriter, r *http.Request) {
	fmt.Println("heloo world")
	set_id := chi.URLParam(r, "set_id")
	if set_id == "" {
		http.Error(w, "Bad Request: set id not found", http.StatusBadRequest)
		slog.Warn("set_id in url param is empty")
		return
	}

	setContext, err := h.store.GetSetContext(set_id)
	if err != nil {
		slog.Warn("failed to fetch Context of a Set", "set-id", set_id, "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = h.sendJson(w, setContext)
	if err != nil {
		slog.Warn("failed to create new set json convertion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

}
