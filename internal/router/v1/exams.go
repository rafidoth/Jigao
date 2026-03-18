package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerExamRoutes(r chi.Router, h *handler.ExamHandler) {
	r.Route("/exams", func(r chi.Router) {
		r.Get("/", h.GetExams)
		r.Post("/", h.CreateExam)
		r.Get("/q/{exam_id}", h.GetQuestionsOfExam)
		r.Get("/{exam_id}", h.GetExamByID)
		r.Put("/{exam_id}", h.UpdateExam)
		r.Delete("/{exam_id}", h.RemoveExam)
	})
}
