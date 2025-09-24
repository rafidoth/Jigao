package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rafidoth/onlyexams/config"
)

type Handler interface {
	CreateNewSet(w http.ResponseWriter, r *http.Request)
}

type Server struct {
	router   *chi.Mux
	handlers Handler
	cfg      *config.Config
}

func NewServer(h Handler, cfg *config.Config) *Server {
	return &Server{
		router:   chi.NewRouter(),
		handlers: h,
		cfg:      cfg,
	}
}

func (s *Server) registerRoutes() {
	s.router.Route("/api/v1/", func(r chi.Router) {
		r.Post("/sets", s.handlers.CreateNewSet)
	})
}

func (s *Server) useMiddlewares() {

	s.router.Use(middleware.RequestID)
	s.router.Use(middleware.RealIP)
	s.router.Use(middleware.Recoverer)
	addCorsMiddleware(s.router, s.cfg)
	s.router.Use(
		middleware.SetHeader("X-Content-Type-Options", "nosniff"),
		middleware.SetHeader("X-Frame-Options", "deny"),
	)
	s.router.Use(middleware.NoCache)

	s.router.Use(AuthMiddleware)
	s.router.Use(LogRequestMiddleware)
}

func (s *Server) Start(addr string) {
	s.useMiddlewares()
	s.registerRoutes()
	if addr == "" {
		addr = "8888"
	}
	fmt.Printf("Server is starting at %v \n", addr)
	err := http.ListenAndServe(":"+addr, s.router)
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}
