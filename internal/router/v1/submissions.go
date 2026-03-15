package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerSubmissionRoutes(r chi.Router, h *handler.SubmissionHandler) {
	r.Route("/submissions", func(r chi.Router) {
		r.Get("/{exam_id}", h.GetSubmissionResult)
	})
}
