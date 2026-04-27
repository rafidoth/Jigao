package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rs/zerolog"
)

type QuestionService struct {
	setRepo      *repository.SetRepository
	questionRepo *repository.QuestionRepository
	userRepo     *repository.UserRepository
	log          zerolog.Logger
}

func NewQuestionService(
	setRepo *repository.SetRepository,
	questionRepo *repository.QuestionRepository,
	userRepo *repository.UserRepository,
	log zerolog.Logger,
) *QuestionService {
	return &QuestionService{
		setRepo:      setRepo,
		questionRepo: questionRepo,
		userRepo:     userRepo,
		log:          log,
	}
}

// ---------------------------------------------------------------------------
// Access Control
// ---------------------------------------------------------------------------

// ErrForbidden is returned when a user does not have access to a resource.
var ErrForbidden = errs.NewForbiddenError("You do not have access to this resource", false)

// AuthorizeSetAccess checks whether the given user may view the set identified
// by setID. It returns the owner's user ID on success or ErrForbidden.
func (s *QuestionService) AuthorizeSetAccess(ctx context.Context, userID, setID string) (ownerUserID string, err error) {
	s.log.Debug().Str("user_id", userID).Str("set_id", setID).Msg("authorize set access")

	vis, err := s.setRepo.GetVisibility(setID)
	if err != nil {
		s.log.Error().Err(err).Str("set_id", setID).Msg("failed to get set visibility")
		return "", fmt.Errorf("get visibility: %w", err)
	}

	ownerUserID, err = s.setRepo.GetOwnerUserId(setID)
	if err != nil {
		s.log.Error().Err(err).Str("set_id", setID).Msg("failed to get set owner")
		return "", fmt.Errorf("get owner: %w", err)
	}

	switch vis {
	case "private":
		if userID != ownerUserID {
			s.log.Warn().Str("user_id", userID).Str("set_id", setID).Str("visibility", vis).Msg("set access forbidden")
			return "", ErrForbidden
		}
	case "restricted":
		if userID != ownerUserID {
			hasAccess, err := s.setRepo.CheckUserAccess(userID, setID)
			if err != nil {
				s.log.Error().Err(err).Str("user_id", userID).Str("set_id", setID).Msg("failed to check user access")
				return "", fmt.Errorf("check user access: %w", err)
			}
			if !hasAccess {
				s.log.Warn().Str("user_id", userID).Str("set_id", setID).Str("visibility", vis).Msg("set access forbidden")
				return "", ErrForbidden
			}
		}
	case "public":
		// Everyone is allowed.
	default:
		s.log.Error().Str("set_id", setID).Str("visibility", vis).Msg("unknown set visibility")
		return "", fmt.Errorf("unknown visibility %q", vis)
	}

	return ownerUserID, nil
}

// Questions

// GetAllQuestionsInASet checks access then returns all questions with answers and choices.
func (s *QuestionService) GetAllQuestionsInASet(ctx context.Context, userID, setID string) ([]model.QuestionWithAnswer, error) {
	_, err := s.AuthorizeSetAccess(ctx, userID, setID)
	if err != nil {
		return nil, err
	}

	questions, err := s.questionRepo.GetQuestionsBySetID(setID)
	if err != nil {
		return nil, fmt.Errorf("get questions: %w", err)
	}

	if len(questions) == 0 {
		return []model.QuestionWithAnswer{}, nil
	}

	questionIDs := make([]string, len(questions))
	for i, q := range questions {
		questionIDs[i] = q.Id
	}

	choicesMap, err := s.questionRepo.GetChoicesForQuestions(questionIDs)
	if err != nil {
		return nil, fmt.Errorf("get choices: %w", err)
	}

	answersMap, err := s.questionRepo.GetAnswersForQuestions(questionIDs)
	if err != nil {
		return nil, fmt.Errorf("get answers: %w", err)
	}

	results := make([]model.QuestionWithAnswer, 0, len(questions))
	for _, q := range questions {
		qwa := model.QuestionWithAnswer{
			Question: q,
			Choices:  choicesMap[q.Id],
			Answer:   answersMap[q.Id],
		}
		results = append(results, qwa)
	}

	return results, nil
}

// CreateSingleQuestion creates a question with its choices and answer in a set.
func (s *QuestionService) CreateSingleQuestion(
	ctx context.Context,
	question model.Question,
	choices []model.Choice,
	answer model.Answer,
	setID string,
) error {
	s.log.Info().
		Str("set_id", setID).
		Str("question_type", question.QuestionType).
		Msg("create question request")

	if strings.TrimSpace(question.Question) == "" {
		return errs.NewBadRequestError("question text is required", false, nil, nil, nil)
	}

	switch question.QuestionType {
	case "multiple_choice_questions":
		if answer.CorrectAnswer.MCQ_CorrectChoicePosition <= 0 {
			return errs.NewBadRequestError("answer.correct_answer.mcq_correct_choice_position is required", false, nil, nil, nil)
		}
		if err := s.questionRepo.CreateMultipleChoiceQuestion(question, choices, answer, setID); err != nil {
			s.log.Error().Err(err).Str("set_id", setID).Str("question_type", question.QuestionType).Msg("failed to create question")
			return fmt.Errorf("create MCQ question: %w", err)
		}
	case "fill_in_the_blanks":
		if len(answer.CorrectAnswer.FIB_AcceptedAnswers) == 0 {
			return errs.NewBadRequestError("answer.correct_answer.fib_accepted_answers must contain at least one value", false, nil, nil, nil)
		}
		hasNonEmpty := false
		for _, v := range answer.CorrectAnswer.FIB_AcceptedAnswers {
			if strings.TrimSpace(v) != "" {
				hasNonEmpty = true
				break
			}
		}
		if !hasNonEmpty {
			return errs.NewBadRequestError("answer.correct_answer.fib_accepted_answers cannot be empty", false, nil, nil, nil)
		}
		if err := s.questionRepo.CreateFillInTheBlanks(question, answer, setID); err != nil {
			s.log.Error().Err(err).Str("set_id", setID).Str("question_type", question.QuestionType).Msg("failed to create question")
			return fmt.Errorf("create FIB question: %w", err)
		}
	case "true_false":
		if answer.CorrectAnswer.TF_CorrectChoice == nil {
			return errs.NewBadRequestError("answer.correct_answer.tf_correct_choice is required", false, nil, nil, nil)
		}
		if err := s.questionRepo.CreateTrueFalse(question, answer, setID); err != nil {
			s.log.Error().Err(err).Str("set_id", setID).Str("question_type", question.QuestionType).Msg("failed to create question")
			return fmt.Errorf("create true/false question: %w", err)
		}
	case "short_question":
		if strings.TrimSpace(answer.CorrectAnswer.SQ_ModelAnswer) == "" {
			return errs.NewBadRequestError("answer.correct_answer.sq_model_answer is required", false, nil, nil, nil)
		}
		if err := s.questionRepo.CreateShortQuestion(question, answer, setID); err != nil {
			s.log.Error().Err(err).Str("set_id", setID).Str("question_type", question.QuestionType).Msg("failed to create question")
			return fmt.Errorf("create short question: %w", err)
		}
	default:
		s.log.Warn().Str("set_id", setID).Str("question_type", question.QuestionType).Msg("unsupported question type")
		return fmt.Errorf("unsupported question type: %s", question.QuestionType)
	}

	s.log.Info().Str("set_id", setID).Str("question_type", question.QuestionType).Msg("question created")
	return nil
}
