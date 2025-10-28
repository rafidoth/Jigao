package examsHandler

import (
	"time"

	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/exams/models"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

type Storage interface {
	CreateExamOnASet(
		set_id, title, description string,
		start_time time.Time,
		duration_in_minutes int,
	) error

	GetExamsBySetId(set_id string) ([]exams.Exam, error)
	IsExamExists(exam_id string) error
	GetExamSetId(exam_id string) (string, error)
	GetExamByExamId(examId string) (models.Exam, error)
}

type QuestionsStore interface {
	GetAllQuestionsInASet(setID string) ([]questionsModels.CompleteQuestion, error)
}

// type ExamHub interface {
// 	// Define exam hub methods here
// }

type ExamsHandler struct {
	hub    *exams.ExamHub
	store  Storage
	qStore QuestionsStore
}

func NewHandler(eh *exams.ExamHub, store Storage, qS QuestionsStore) *ExamsHandler {
	return &ExamsHandler{
		hub:    eh,
		store:  store,
		qStore: qS,
	}
}
