package examsHandler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/exams/models"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/users"
)

type Storage interface {
	CreateExamOnASet(
		user_id, set_id, title, description string,
		start_time time.Time,
		duration_in_minutes int,
	) error

	GetExamsBySetId(set_id string) ([]models.Exam, error)
	IsExamExists(exam_id string) error
	GetExamSetId(exam_id string) (string, error)
	GetExamByExamId(examId string) (models.Exam, error)
	RemoveExam(examId string) error
	GetEvaluationResult(examID, userID string) (int, map[string]models.EvaluatedAnswerType, error)
}

type QuestionsStore interface {
	GetAllQuestionsInASet(setID string) ([]questionsModels.CompleteQuestion, error)
	GetOwnerUserId(id string) (string, error)
	CheckUserAccess(userId, setId string) (bool, error)
}

type UsersStore interface {
	GetUserFromId(userId string) (users.User, error)
	GetUserFromEmail(email string) (users.User, error)
}

// type ExamHub interface {
// 	// Define exam hub methods here
// }

type ExamsHandler struct {
	hub    *exams.ExamHub
	store  Storage
	qStore QuestionsStore
	uStore UsersStore
}

func New(eh *exams.ExamHub, store Storage, qS QuestionsStore, uS UsersStore) *ExamsHandler {
	return &ExamsHandler{
		hub:    eh,
		store:  store,
		qStore: qS,
		uStore: uS,
	}
}

func (eh *ExamsHandler) extractUserId(r *http.Request) (string, error) {
	uid, err := r.Context().Value("user-id").(string)
	if !err {
		return "", errors.New("Unable to extract user id from http.Request")
	}
	return uid, nil
}

func (eh *ExamsHandler) sendJson(w http.ResponseWriter, obj any) error {
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(obj)
}
