package middleware

import (
	"context"
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/server"
)

// AuthMiddleware holds the server reference needed by the authentication middleware.
type AuthMiddleware struct {
	srv *server.Server
}

// NewAuthMiddleware creates a new AuthMiddleware.
func NewAuthMiddleware(srv *server.Server) *AuthMiddleware {
	return &AuthMiddleware{srv: srv}
}

// Apply installs Clerk header-based auth and the clerkAuth user-extraction
// middleware on the given router.
func (a *AuthMiddleware) Apply(r *chi.Mux) {
	if a.srv.Config.Auth.SecretKey == "" {
		a.srv.Logger.Warn().Msg("CLERK_SECRET_KEY is not set")
	}
	clerk.SetKey(a.srv.Config.Auth.SecretKey)

	r.Use(clerkhttp.RequireHeaderAuthorization())
	r.Use(a.clerkAuth)
}

// clerkAuth extracts Clerk session claims, fetches the user, and injects
// "user-id" and "user-details" into the request context.
func (a *AuthMiddleware) clerkAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok {
			a.srv.Logger.Warn().Msg("Authentication failed: no session claims")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"access": "unauthorized"}`))
			return
		}

		usr, err := user.Get(r.Context(), claims.Subject)
		if err != nil {
			a.srv.Logger.Error().Err(err).Msg("Authentication failed: could not fetch Clerk user")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"access": "unauthorized"}`))
			return
		}

		ctx := context.WithValue(r.Context(), "user-id", usr.ID)
		ctx = context.WithValue(ctx, "user-details", usr)
		a.srv.Logger.Info().Str("user-id", usr.ID).Str("route", r.URL.Path).Msg("Authenticated user")

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
