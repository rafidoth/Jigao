package utils

import (
	"encoding/json"
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
