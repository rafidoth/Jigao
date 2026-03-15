package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/service"
)

// Handlers aggregates all domain-specific handlers.
type Handlers struct {
	User       *UserHandler
	Set        *SetHandler
	Question   *QuestionHandler
	Exam       *ExamHandler
	Submission *SubmissionHandler
}

// NewHandlers creates a fully-wired Handlers instance.
func NewHandlers(svc *service.Services) *Handlers {
	return &Handlers{
		User:       NewUserHandler(svc.User),
		Set:        NewSetHandler(svc.Question),
		Question:   NewQuestionHandler(svc.Question),
		Exam:       NewExamHandler(svc.Exam),
		Submission: NewSubmissionHandler(svc.Exam),
	}
}

// extractUserID pulls the authenticated user ID from the request context.
func extractUserID(r *http.Request) (string, error) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok || uid == "" {
		return "", fmt.Errorf("user-id not found in context")
	}
	return uid, nil
}

// writeJSON serialises payload as JSON and writes it with the given status code.
func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Warn("failed to encode JSON response", "error", err)
	}
}
