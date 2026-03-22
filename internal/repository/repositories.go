package repository

import "github.com/rafidoth/onlyexams/internal/server"

type Repositories struct {
	User     *UserRepository
	Set      *SetRepository
	Question *QuestionRepository
	Exam     *ExamRepository
	SelfTest *SelfTestRepository
}

func NewRepositories(s *server.Server) *Repositories {
	return &Repositories{
		User:     NewUserRepository(s),
		Set:      NewSetRepository(s),
		Question: NewQuestionRepository(s),
		Exam:     NewExamRepository(s),
		SelfTest: NewSelfTestRepository(s),
	}
}
