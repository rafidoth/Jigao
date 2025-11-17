package questionsHandler

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) GetSetAccessUsersList(w http.ResponseWriter, r *http.Request) {
	setID := chi.URLParam(r, "set_id")
	if setID == "" {
		http.Error(w, "set_id is required", http.StatusBadRequest)
		return
	}

	ownerId, err := h.store.GetOwnerUserId(setID)
	if err != nil {
		http.Error(w, "Failed Request", http.StatusInternalServerError)

		slog.Error("failed to get owner id", "error", err)
		return
	}

	// call user store to get the user
	user, err := h.usersStore.GetUserFromId(ownerId)
	if err != nil {
		http.Error(w, "Failed Request", http.StatusInternalServerError)
		slog.Error("failed to get user", "error", err)
		return
	}

	shared_uList, err := h.store.GetSharedAccessUsersList(setID)
	if err != nil {
		http.Error(w, "Failed Request", http.StatusInternalServerError)
		slog.Error("failed to get shared access users list", "error", err)

		return
	}

	resp := append(shared_uList, user)
	fmt.Println("response access", resp)

	w.WriteHeader(http.StatusOK)
	if err := h.sendJson(w, resp); err != nil {
		slog.Warn("failed json conversion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

type AccessRequestBody struct {
	UserId string `json:"user_id"`
	SetId  string `json:"set_id"`
}

func (h *Handler) AllowSetAccess(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed Request", http.StatusInternalServerError)
		slog.Error("failed to read request body", "error", err)
		return
	}

	var reqBody AccessRequestBody
	if err := json.Unmarshal(body, &reqBody); err != nil {
		http.Error(w, "Failed Request", http.StatusBadRequest)
		slog.Error("failed to unmarshal request body", "error", err)
		return
	}

	if err := h.store.AddSharedAccessUser(reqBody.SetId, reqBody.UserId); err != nil {
		http.Error(w, "Failed Request", http.StatusInternalServerError)
		slog.Error("failed to add shared access user", "error", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
