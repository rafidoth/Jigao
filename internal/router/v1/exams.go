package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
	"github.com/rafidoth/onlyexams/internal/websockets/examWs"
)

func registerExamRoutes(r chi.Router, h *handler.ExamHandler, wsH *examWs.ExamWsHandler) {
	r.Route("/exams", func(r chi.Router) {
		// exam cruds
		r.Get("/", h.GetExams)
		r.Post("/", h.CreateExam)
		r.Get("/q/{exam_id}", h.GetQuestionsOfExam)
		r.Get("/{exam_id}", h.GetExamByID)
		r.Put("/{exam_id}", h.UpdateExam)
		r.Delete("/{exam_id}", h.RemoveExam)
		// exam room routes
		r.Post("/join", h.JoinExam)
		// exam ws route
		r.Get("/ws/{exam_id}", wsH.ServeWS)

	})
}
