package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerSelfTestRoutes(r chi.Router, h *handler.SelfTestHandler) {
	r.Route("/self-tests", func(r chi.Router) {
		r.Post("/submissions", h.SubmitSelfTest)
	})
}
