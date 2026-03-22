package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

// RegisterV1Routes mounts all v1 API sub-routes onto the given chi.Router.
func RegisterV1Routes(r chi.Router, h *handler.Handlers) {
	registerUserRoutes(r, h.User)
	registerSetRoutes(r, h.Set)
	registerQuestionRoutes(r, h.Question)
	registerExamRoutes(r, h.Exam)
	registerSubmissionRoutes(r, h.Submission)
	registerSelfTestRoutes(r, h.SelfTest)
}
