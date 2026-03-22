package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/internal/users"
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

// Set CRUD

// CreateNewSet creates a new empty set with default visibility="private" and title="untitled".
func (s *QuestionService) CreateNewSet(ctx context.Context, userID string) (*model.Set, error) {
	s.log.Info().Str("user_id", userID).Msg("create set request")

	set := &model.Set{
		Visibility: "private",
		Title:      "untitled",
		UserId:     userID,
	}
	created, err := s.setRepo.CreateNewSet(set)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", userID).Msg("failed to create set")
		return nil, fmt.Errorf("create new set: %w", err)
	}

	s.log.Info().Str("user_id", userID).Str("set_id", created.ID).Msg("set created")
	return created, nil
}

// GetSetWithContext retrieves a set and its context after checking access.
// Returns the set, context string, and any error.
func (s *QuestionService) GetSetWithContext(ctx context.Context, userID, setID string) (*model.Set, string, error) {
	ownerUserID, err := s.AuthorizeSetAccess(ctx, userID, setID)
	if err != nil {
		return nil, "", err
	}

	qSet := &model.Set{
		ID:     setID,
		UserId: ownerUserID,
	}

	set, err := s.setRepo.GetASet(qSet)
	if err != nil {
		return nil, "", fmt.Errorf("get set: %w", err)
	}

	setContext, err := s.setRepo.GetSetContext(setID)
	setCtx := ""
	if err == nil && setContext != nil {
		setCtx = setContext.Setcontext
	}

	return set, setCtx, nil
}

// UpdateSet updates a set's visibility and title.
func (s *QuestionService) UpdateSet(ctx context.Context, userID, setID, visibility, title string) (*model.Set, error) {
	s.log.Info().Str("user_id", userID).Str("set_id", setID).Msg("update set request")

	qSet := &model.Set{
		ID:         setID,
		Visibility: visibility,
		Title:      title,
		UserId:     userID,
	}
	updated, err := s.setRepo.UpdateASet(qSet)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", userID).Str("set_id", setID).Msg("failed to update set")
		return nil, fmt.Errorf("update set: %w", err)
	}

	s.log.Info().Str("user_id", userID).Str("set_id", setID).Msg("set updated")
	return updated, nil
}

// DeleteSetWithContext deletes a set and its associated context.
func (s *QuestionService) DeleteSetWithContext(ctx context.Context, userID, setID string) (*model.Set, error) {
	s.log.Info().Str("user_id", userID).Str("set_id", setID).Msg("delete set request")

	qSet := &model.Set{
		ID:     setID,
		UserId: userID,
	}

	deleted, err := s.setRepo.DeleteASet(qSet)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", userID).Str("set_id", setID).Msg("failed to delete set")
		return nil, fmt.Errorf("delete set: %w", err)
	}

	// Best-effort context deletion — set might not have a context row.
	_ = s.setRepo.DeleteSetContext(setID)

	s.log.Info().Str("user_id", userID).Str("set_id", setID).Msg("set deleted")

	return deleted, nil
}

// GetRecentSets returns the most recent sets for a user (owned + shared).
func (s *QuestionService) GetRecentSets(ctx context.Context, userID string, limit int) ([]*model.Set, error) {
	sets, err := s.setRepo.GetRecentSets(limit, userID)
	if err != nil {
		return nil, fmt.Errorf("get recent sets: %w", err)
	}
	return sets, nil
}

// GetRecentSetsWithOwners returns recent sets enriched with owner user info.
func (s *QuestionService) GetRecentSetsWithOwners(ctx context.Context, userID string, limit int) ([]SetWithOwner, error) {
	sets, err := s.setRepo.GetRecentSets(limit, userID)
	if err != nil {
		return nil, fmt.Errorf("get recent sets: %w", err)
	}

	results := make([]SetWithOwner, 0, len(sets))
	for _, set := range sets {
		owner, err := s.userRepo.GetUserFromId(set.UserId)
		if err != nil {
			return nil, fmt.Errorf("get owner for set %s: %w", set.ID, err)
		}
		results = append(results, SetWithOwner{Set: *set, Owner: owner})
	}
	return results, nil
}

// SetWithOwner pairs a set with its owner info (used by GetRecentSetsWithOwners).
type SetWithOwner struct {
	Set   model.Set  `json:"set"`
	Owner users.User `json:"owner"`
}

// GetSetContext retrieves the context for a set.
func (s *QuestionService) GetSetContext(ctx context.Context, setID string) (*model.SetContext, error) {
	sc, err := s.setRepo.GetSetContext(setID)
	if err != nil {
		return nil, fmt.Errorf("get set context: %w", err)
	}
	return sc, nil
}

// Shared Access

// GetSetAccessList returns the owner + all shared users for a set.
func (s *QuestionService) GetSetAccessList(ctx context.Context, setID string) ([]users.User, error) {
	ownerID, err := s.setRepo.GetOwnerUserId(setID)
	if err != nil {
		return nil, fmt.Errorf("get owner: %w", err)
	}

	owner, err := s.userRepo.GetUserFromId(ownerID)
	if err != nil {
		return nil, fmt.Errorf("get owner user: %w", err)
	}

	sharedUsers, err := s.setRepo.GetSharedAccessUsersList(setID)
	if err != nil {
		return nil, fmt.Errorf("get shared users: %w", err)
	}

	return append(sharedUsers, owner), nil
}

// AllowSetAccess grants a user shared access to a set.
func (s *QuestionService) AllowSetAccess(ctx context.Context, setID, userID string) error {
	s.log.Info().Str("set_id", setID).Str("user_id", userID).Msg("grant set access request")

	if err := s.setRepo.AddSharedAccessUser(setID, userID); err != nil {
		s.log.Error().Err(err).Str("set_id", setID).Str("user_id", userID).Msg("failed to grant set access")
		return fmt.Errorf("allow set access: %w", err)
	}

	s.log.Info().Str("set_id", setID).Str("user_id", userID).Msg("set access granted")
	return nil
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
