package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rs/zerolog"
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
func NewHandlers(svc *service.Services, log zerolog.Logger) *Handlers {
	return &Handlers{
		User:       NewUserHandler(svc.User, log.With().Str("handler", "user").Logger()),
		Set:        NewSetHandler(svc.Question, log.With().Str("handler", "set").Logger()),
		Question:   NewQuestionHandler(svc.Question, log.With().Str("handler", "question").Logger()),
		Exam:       NewExamHandler(svc.Exam, log.With().Str("handler", "exam").Logger()),
		Submission: NewSubmissionHandler(svc.Exam, log.With().Str("handler", "submission").Logger()),
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
func writeJSON(log zerolog.Logger, w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Warn().Err(err).Msg("failed to encode JSON response")
	}
}

// writeError inspects the error and writes an appropriate JSON error response.
// If the error is an *errs.HTTPError, it uses the structured status/code/message.
// Otherwise it logs the error and returns a generic 500 Internal Server Error.
func writeError(log zerolog.Logger, w http.ResponseWriter, err error, logMsg string) {
	var httpErr *errs.HTTPError
	if errors.As(err, &httpErr) {
		if httpErr.Status >= http.StatusInternalServerError {
			log.Error().Err(err).Str("message", logMsg).Int("status", httpErr.Status).Msg("request failed")
		} else {
			log.Warn().Err(err).Str("message", logMsg).Int("status", httpErr.Status).Msg("request failed")
		}
		writeJSON(log, w, httpErr.Status, httpErr)
		return
	}

	// Unrecognised error — log and return 500.
	log.Error().Err(err).Str("message", logMsg).Msg("unexpected error")
	writeJSON(log, w, http.StatusInternalServerError, errs.NewInternalServerError())
}
