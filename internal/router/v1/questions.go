package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerQuestionRoutes(r chi.Router, h *handler.QuestionHandler) {
	r.Route("/questions", func(r chi.Router) {
		r.Post("/", h.CreateQuestion)
		r.Get("/", h.GetAllQuestions)
	})
}
