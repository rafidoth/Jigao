package examsHandler

import (
	"time"

	"github.com/rafidoth/onlyexams/internal/exams"
)

type Storage interface {
	CreateExamOnASet(
		set_id, title, description string,
		start_time time.Time,
		duration_in_minutes int,
	) error

	GetExamsBySetId(set_id string) ([]exams.Exam, error)
	IsExamExists(exam_id string) error
}

// type ExamHub interface {
// 	// Define exam hub methods here
// }

type ExamsHandler struct {
	hub   *exams.ExamHub
	store Storage
}

func NewHandler(eh *exams.ExamHub, store Storage) *ExamsHandler {
	return &ExamsHandler{
		hub:   eh,
		store: store,
	}
}
