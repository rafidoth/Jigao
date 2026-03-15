package middleware

import (
	"github.com/rafidoth/onlyexams/internal/server"
)

// Middlewares aggregates all middleware groups.
type Middlewares struct {
	Global *GlobalMiddlewares
	Auth   *AuthMiddleware
}

// NewMiddlewares creates a fully-wired Middlewares instance.
func NewMiddlewares(srv *server.Server) *Middlewares {
	return &Middlewares{
		Global: NewGlobalMiddlewares(srv),
		Auth:   NewAuthMiddleware(srv),
	}
}
