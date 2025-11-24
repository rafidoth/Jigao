package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
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
		slog.Info("Incoming Request Logger", "URL", r.URL, "Method", r.Method, "Connection", r.Header.Get("Connection"))

		connectionString := r.Header.Get("Connection")
		fmt.Println("hello world", connectionString)
		if strings.Contains(strings.ToLower(connectionString), "upgrade") {

			queryParam := r.URL.Query()
			token := queryParam.Get("token")
			slog.Info("ws connection eta, token eije ", "token", token)

			r.Header.Set("Authorization", token)

		}
		next.ServeHTTP(w, r)
	}
	return http.HandlerFunc(fn)
}

// my middlewares
func AuthMiddleware(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok {
			slog.Warn("Authentication failed", "error", "Unauthorized")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"access": "unauthorized"}`))
			return
		}

		usr, err := user.Get(r.Context(), claims.Subject)
		if err != nil {
			slog.Error("Authentication failed", "error", err)
		}
		userId := usr.ID
		ctx := context.WithValue(r.Context(), "user-id", userId)
		ctx = context.WithValue(ctx, "user-details", usr)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
	return http.HandlerFunc(fn)
}
