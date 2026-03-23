package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerSelfTestRoutes(r chi.Router, h *handler.SelfTestHandler) {
	r.Route("/self-tests", func(r chi.Router) {
		r.Get("/", h.GetSelfTestsBySetID)      // GET /self-tests?set_id={uuid}&limit=N
		r.Get("/recent", h.GetRecentSelfTests) // GET /self-tests/recent?limit=N
		r.Post("/submissions", h.SubmitSelfTest)
		r.Get("/result/{id}", h.GetSelfTestResult)
	})
}
