package utils

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
)

func ExtractRequestBody(r *http.Request, dest any) bool {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		slog.Warn("failed to read request body", "error", err)
		return false
	}
	err = json.Unmarshal(body, dest)
	if err != nil {
		slog.Warn("failed to marshal request body", "error", err)
		return false
	}
	return true
}

func ExtractUserId(r *http.Request) (string, error) {
	uid, err := r.Context().Value("user-id").(string)
	if !err {
		return "", errors.New("Unable to extract user id from http.Request")
	}
	return uid, nil
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	b, err := json.Marshal(payload)
	if err != nil {
		slog.Warn("failed to marshal json response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if _, err := w.Write(b); err != nil {
		slog.Warn("failed to write json response", "error", err)
	}
}
