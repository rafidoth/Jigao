package questionsHandler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

// GET /api/v1/questions?set_id=<id>
func (h *Handler) GetAllQuestionsInASet(w http.ResponseWriter, r *http.Request) {
	userId, ok := r.Context().Value("user-id").(string)
	if !ok {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	setId := r.URL.Query().Get("set_id")
	if setId == "" {
		http.Error(w, "Bad Request: set_id is required", http.StatusBadRequest)
		return
	}

	vis, err := h.store.GetVisibility(setId)
	if err != nil {
		slog.Warn("failed to get visibility", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	fmt.Println("visibility fetched ", vis)

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
	}

	questions, err := h.store.GetAllQuestionsInASet(setId)
	if err != nil {
		slog.Warn("failed to get all questions in a set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	jsonRes, err := json.Marshal(questions)
	if err != nil {
		slog.Warn("failed to marshal response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(jsonRes)
	if err != nil {
		slog.Warn("failed to write response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
