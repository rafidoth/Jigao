package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/errs"
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
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "login: missing user-id")
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
		writeError(w, errs.NewBadRequestError("Failed to read request body", false, nil, nil, nil), "login: read body")
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "login: unmarshal body")
		return
	}

	if err := h.svc.LoginUser(r.Context(), uid, req.Email, req.Name, req.ImageURL); err != nil {
		writeError(w, err, "login user failed")
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User logged in successfully"))
}

// GetUserFromEmail handles GET /users/user?email= — returns a user by email.
func (h *UserHandler) GetUserFromEmail(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		writeError(w, errs.NewBadRequestError("email is required", false, nil, nil, nil), "get user: missing email")
		return
	}

	user, err := h.svc.GetUserByEmail(r.Context(), email)
	if err != nil {
		writeError(w, err, "get user by email failed")
		return
	}

	writeJSON(w, http.StatusOK, user)
}
