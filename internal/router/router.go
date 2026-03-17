package router

import (
	"github.com/go-chi/chi/v5"

	"github.com/rafidoth/onlyexams/internal/handler"
	mw "github.com/rafidoth/onlyexams/internal/middleware"
	v1 "github.com/rafidoth/onlyexams/internal/router/v1"
	"github.com/rafidoth/onlyexams/internal/server"
)

// New creates a fully-configured chi.Mux with all middleware and routes.
func New(srv *server.Server, h *handler.Handlers) *chi.Mux {
	r := chi.NewRouter()
	// OpenAPI spec and Scalar API reference UI
	middlewares := mw.NewMiddlewares(srv)

	// Global middleware (order matters)
	middlewares.Global.Recovery(r)
	middlewares.Global.RequestID(r)
	middlewares.Global.CORS(r)
	middlewares.Global.Security(r)
	middlewares.Global.Logging(r)

	// Authentication
	middlewares.Auth.Apply(r)
	RegisterOpenAPIRoutes(r)

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		v1.RegisterV1Routes(r, h)
	})

	return r
}
