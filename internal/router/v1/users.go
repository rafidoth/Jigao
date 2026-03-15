package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerUserRoutes(r chi.Router, h *handler.UserHandler) {
	r.Route("/users", func(r chi.Router) {
		r.Post("/", h.LoginUser)
		r.Get("/user", h.GetUserFromEmail)
	})
}
