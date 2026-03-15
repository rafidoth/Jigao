package service

import (
	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/proto"
)

type Services struct {
	User     *UserService
	Question *QuestionService
	Exam     *ExamService
}

func NewServices(
	repos *repository.Repositories,
	aiClient proto.JigaoAIClient,
	hub *exams.ExamHub,
) *Services {
	return &Services{
		User: NewUserService(repos.User),
		Question: NewQuestionService(
			repos.Set,
			repos.Question,
			repos.User,
			aiClient,
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
