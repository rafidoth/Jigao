package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/service"
)

// UserHandler handles user-related HTTP requests.
type UserHandler struct {
	svc *service.UserService
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

// LoginUser handles POST /users/ — inserts a user if they don't already exist.
func (h *UserHandler) LoginUser(w http.ResponseWriter, r *http.Request) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	type reqBody struct {
		ID       string `json:"id"`
		Email    string `json:"email"`
		Name     string `json:"name"`
		ImageURL string `json:"image_url"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		slog.Warn("failed to unmarshal login body", "error", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if err := h.svc.LoginUser(r.Context(), uid, req.Email, req.Name, req.ImageURL); err != nil {
		slog.Error("login user failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User logged in successfully"))
}

// GetUserFromEmail handles GET /users/user?email= — returns a user by email.
func (h *UserHandler) GetUserFromEmail(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	user, err := h.svc.GetUserByEmail(r.Context(), email)
	if err != nil {
		slog.Error("get user by email failed", "error", err)
		http.Error(w, "User Not Found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, user)
}
