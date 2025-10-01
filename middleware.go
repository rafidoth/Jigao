package main

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/rafidoth/onlyexams/config"
)

func addCorsMiddleware(router *chi.Mux, cfg *config.Config) {
	origin := cfg.CorsAllowed
	if origin == "" {
		slog.Warn("Cors origin not found")
	}
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{origin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
}

func LogRequestMiddleware(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		slog.Info("Incoming Request Logger", "URL", r.URL, "Method", r.Method)
		next.ServeHTTP(w, r)
	}
	return http.HandlerFunc(fn)
}

// my middlewares
func AuthMiddleware(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		// TODO
		// Add Clerk verification here
		// Add other auth logics
		//
		userId := "123"
		ctx := context.WithValue(r.Context(), "user-id", userId)

		next.ServeHTTP(w, r.WithContext(ctx))
	}

	return http.HandlerFunc(fn)
}
