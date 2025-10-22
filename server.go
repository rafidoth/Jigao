package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rafidoth/onlyexams/config"
)

type QuestionsHandler interface {
	CreateNewSet(w http.ResponseWriter, r *http.Request)
	GetASet(w http.ResponseWriter, r *http.Request)
	UpdateASet(w http.ResponseWriter, r *http.Request)
	DeleteASet(w http.ResponseWriter, r *http.Request)
	GetRecentSets(w http.ResponseWriter, r *http.Request)
	GetSetContext(w http.ResponseWriter, r *http.Request)
	CreateANewQuestionInASet(w http.ResponseWriter, r *http.Request)
	GetAllQuestionsInASet(w http.ResponseWriter, r *http.Request)
}

type ExamsHandler interface {
	CreateRoom(w http.ResponseWriter, r *http.Request)
	JoinRoom(w http.ResponseWriter, r *http.Request)
	CreateExamOnASet(w http.ResponseWriter, r *http.Request)
	GetExamsOnASet(w http.ResponseWriter, r *http.Request)
}

type Server struct {
	router           *chi.Mux
	questionsHandler QuestionsHandler
	examsHandler     ExamsHandler
	cfg              *config.Config
}

func NewServer(qh QuestionsHandler, eh ExamsHandler, cfg *config.Config) *Server {
	return &Server{
		router:           chi.NewRouter(),
		questionsHandler: qh,
		examsHandler:     eh,
		cfg:              cfg,
	}
}

func (s *Server) registerRoutes() {
	s.router.Route("/api/v1/", func(r chi.Router) {
		r.Route("/sets", func(r chi.Router) {
			r.Get("/", s.questionsHandler.GetRecentSets)
			r.Post("/", s.questionsHandler.CreateNewSet)
			r.Get("/{set_id}", s.questionsHandler.GetASet)
			r.Put("/{set_id}", s.questionsHandler.UpdateASet)
			r.Delete("/{set_id}", s.questionsHandler.DeleteASet)
		})
		r.Route("/questions", func(r chi.Router) {
			r.Post("/", s.questionsHandler.CreateANewQuestionInASet)
			r.Get("/", s.questionsHandler.GetAllQuestionsInASet)
		})

		r.Route("/exams", func(r chi.Router) {
			r.Post("/", s.examsHandler.CreateExamOnASet)
			r.Get("/", s.examsHandler.GetExamsOnASet)
			r.Post("/rooms/{exam_id}", s.examsHandler.CreateRoom)
			r.Get("/join/{room_id}", s.examsHandler.JoinRoom)
		})
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
		addr = "9999"
	}
	fmt.Printf("Server is starting at %v \n", addr)
	err := http.ListenAndServe(":"+addr, s.router)
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}
