package service

import (
	"github.com/rafidoth/onlyexams/internal/ai"
	"github.com/rafidoth/onlyexams/internal/config"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rs/zerolog"
)

type Services struct {
	User           *UserService
	Question       *QuestionService
	Exam           *ExamService
	SelfTest       *SelfTestService
	AIConversation *AIConversationService
	Ai             *ai.AI
}

func NewServices(
	repos *repository.Repositories,
	log zerolog.Logger,
	cfg *config.Config,
) *Services {
	return &Services{
		User: NewUserService(
			repos.User,
			log.With().Str("service", "user").Logger(),
		),
		Question: NewQuestionService(
			repos.Set,
			repos.Question,
			repos.User,
			log.With().Str("service", "question").Logger(),
		),
		Exam: NewExamService(
			repos.Exam,
			repos.Set,
			repos.Question,
			repos.User,
			log.With().Str("service", "exam").Logger(),
		),
		SelfTest: NewSelfTestService(
			repos.SelfTest,
			repos.Question,
			log.With().Str("service", "self_test").Logger(),
		),
		AIConversation: NewAIConversationService(
			repos.AIConversations,
			log.With().Str("service", "ai_conversation").Logger(),
		),
		Ai: ai.NewAI(cfg),
	}
}
