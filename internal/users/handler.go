package users

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
)

type Storage interface {
	InsertUserIfNotExists(userid, email, name string) error
}

type Handler struct {
	store Storage
}

func NewHandler(store Storage) *Handler {
	return &Handler{
		store: store,
	}
}

type UserDetailsBody struct {
	Id    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func (h *Handler) LogInUser(w http.ResponseWriter, r *http.Request) {

	uid, ok := r.Context().Value("user-id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user UserDetailsBody

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	err = json.Unmarshal(body, &user)
	if err != nil {
		slog.Warn("failed to marshal request body", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = h.store.InsertUserIfNotExists(uid, user.Email, user.Name)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User logged in successfully"))

}
