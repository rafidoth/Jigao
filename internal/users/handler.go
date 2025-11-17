package users

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
)

type Storage interface {
	InsertUserIfNotExists(userid, email, name, imageUrl string) error
	GetUserFromEmail(email string) (User, error)
}

type Handler struct {
	store Storage
}

func NewHandler(store Storage) *Handler {
	return &Handler{
		store: store,
	}
}

func (h *Handler) getQueryParam(r *http.Request, want string) string {
	qP := r.URL.Query()
	p := qP.Get(want)
	return p
}

func (h *Handler) rcvJson(r *http.Request, container any) error {
	if err := json.NewDecoder(r.Body).Decode(container); err != nil {
		return err
	}
	defer r.Body.Close()
	return nil
}

func (h *Handler) sendJson(w http.ResponseWriter, obj any) error {
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(obj)
}

func (h *Handler) extractUserId(r *http.Request) (string, error) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok {
		return "", errors.New("Unable to extract user id from http.Request")
	}
	return uid, nil
}

type UserDetailsBody struct {
	Id       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	ImageUrl string `json:"image_url"`
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

	err = h.store.InsertUserIfNotExists(uid, user.Email, user.Name, user.ImageUrl)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User logged in successfully"))

}

func (h *Handler) GetUserFromEmail(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}
	fmt.Println("email ", email)

	user, err := h.store.GetUserFromEmail(email)
	if err != nil {
		http.Error(w, "User Not Found", http.StatusNotFound)
		slog.Error("failed to get user id from email", "error", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = h.sendJson(w, user)
	if err != nil {
		slog.Warn("failed json conversion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
