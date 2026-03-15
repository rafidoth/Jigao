package service

import (
	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/repository"
)

type Services struct {
	User     *UserService
	Question *QuestionService
	Exam     *ExamService
}

func NewServices(
	repos *repository.Repositories,
	hub *exams.ExamHub,
) *Services {
	return &Services{
		User: NewUserService(repos.User),
		Question: NewQuestionService(
			repos.Set,
			repos.Question,
			repos.User,
		),
		Exam: NewExamService(
			repos.Exam,
			repos.Set,
			repos.Question,
			repos.User,
			hub,
		),
	}
}
