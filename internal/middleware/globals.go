package middleware

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/rafidoth/onlyexams/internal/server"
)

// GlobalMiddlewares holds the server reference needed by the global middleware stack.
type GlobalMiddlewares struct {
	srv *server.Server
}

// NewGlobalMiddlewares creates a new GlobalMiddlewares.
func NewGlobalMiddlewares(srv *server.Server) *GlobalMiddlewares {
	return &GlobalMiddlewares{srv: srv}
}

// Recovery installs panic recovery middleware.
func (g *GlobalMiddlewares) Recovery(r *chi.Mux) {
	r.Use(chimw.Recoverer)
}

// RequestID installs the chi RequestID and RealIP middleware.
func (g *GlobalMiddlewares) RequestID(r *chi.Mux) {
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
}

// CORS installs CORS handling using the configured allowed origins.
func (g *GlobalMiddlewares) CORS(r *chi.Mux) {
	origins := g.srv.Config.Server.CORSAllowedOrigins
	if len(origins) == 0 {
		g.srv.Logger.Warn().Msg("CORS ORIGIN NOT FOUND")
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
}

// Security installs security-related headers and caching policy.
func (g *GlobalMiddlewares) Security(r *chi.Mux) {
	r.Use(
		chimw.SetHeader("X-Content-Type-Options", "nosniff"),
		chimw.SetHeader("X-Frame-Options", "deny"),
	)
	r.Use(chimw.NoCache)
}

// Logging installs the request logging middleware.
// For WebSocket upgrade requests it also moves the token query parameter
// into the Authorization header so Clerk auth works.
func (g *GlobalMiddlewares) Logging(r *chi.Mux) {
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			g.srv.Logger.Info().
				Str("url", req.URL.String()).
				Str("method", req.Method).
				Str("connection", req.Header.Get("Connection")).
				Msg("Incoming Request")

			conn := req.Header.Get("Connection")
			if strings.Contains(strings.ToLower(conn), "upgrade") {
				token := req.URL.Query().Get("token")
				if token != "" {
					g.srv.Logger.Info().Msg("WebSocket upgrade: moving token to Authorization header")
					req.Header.Set("Authorization", token)
				}
			}

			next.ServeHTTP(w, req)
		})
	})
}
