package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/internal/users"
	"github.com/rafidoth/onlyexams/proto"
)

type QuestionService struct {
	setRepo      *repository.SetRepository
	questionRepo *repository.QuestionRepository
	userRepo     *repository.UserRepository
	aiClient     proto.JigaoAIClient
}

func NewQuestionService(
	setRepo *repository.SetRepository,
	questionRepo *repository.QuestionRepository,
	userRepo *repository.UserRepository,
	aiClient proto.JigaoAIClient,
) *QuestionService {
	return &QuestionService{
		setRepo:      setRepo,
		questionRepo: questionRepo,
		userRepo:     userRepo,
		aiClient:     aiClient,
	}
}

// ---------------------------------------------------------------------------
// Access Control
// ---------------------------------------------------------------------------

// ErrForbidden is returned when a user does not have access to a resource.
var ErrForbidden = errors.New("forbidden")

// AuthorizeSetAccess checks whether the given user may view the set identified
// by setID. It returns the owner's user ID on success or ErrForbidden.
func (s *QuestionService) AuthorizeSetAccess(ctx context.Context, userID, setID string) (ownerUserID string, err error) {
	vis, err := s.setRepo.GetVisibility(setID)
	if err != nil {
		return "", fmt.Errorf("get visibility: %w", err)
	}

	ownerUserID, err = s.setRepo.GetOwnerUserId(setID)
	if err != nil {
		return "", fmt.Errorf("get owner: %w", err)
	}

	switch vis {
	case "private":
		if userID != ownerUserID {
			return "", ErrForbidden
		}
	case "restricted":
		if userID != ownerUserID {
			hasAccess, err := s.setRepo.CheckUserAccess(userID, setID)
			if err != nil {
				return "", fmt.Errorf("check user access: %w", err)
			}
			if !hasAccess {
				return "", ErrForbidden
			}
		}
	case "public":
		// Everyone is allowed.
	default:
		return "", fmt.Errorf("unknown visibility %q", vis)
	}

	return ownerUserID, nil
}

// ---------------------------------------------------------------------------
// Set CRUD
// ---------------------------------------------------------------------------

// CreateNewSet creates a new empty set with default visibility="private" and title="untitled".
func (s *QuestionService) CreateNewSet(ctx context.Context, userID string) (*questionsModels.Set, error) {
	set := &questionsModels.Set{
		Visibility: "private",
		Title:      "untitled",
		UserId:     userID,
	}
	created, err := s.setRepo.CreateNewSet(set)
	if err != nil {
		return nil, fmt.Errorf("create new set: %w", err)
	}
	return created, nil
}

// GetSetWithContext retrieves a set and its context after checking access.
// Returns the set, context string, and any error.
func (s *QuestionService) GetSetWithContext(ctx context.Context, userID, setID string) (*questionsModels.Set, string, error) {
	ownerUserID, err := s.AuthorizeSetAccess(ctx, userID, setID)
	if err != nil {
		return nil, "", err
	}

	qSet := &questionsModels.Set{
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
func (s *QuestionService) UpdateSet(ctx context.Context, userID, setID, visibility, title string) (*questionsModels.Set, error) {
	qSet := &questionsModels.Set{
		ID:         setID,
		Visibility: visibility,
		Title:      title,
		UserId:     userID,
	}
	updated, err := s.setRepo.UpdateASet(qSet)
	if err != nil {
		return nil, fmt.Errorf("update set: %w", err)
	}
	return updated, nil
}

// DeleteSetWithContext deletes a set and its associated context.
func (s *QuestionService) DeleteSetWithContext(ctx context.Context, userID, setID string) (*questionsModels.Set, error) {
	qSet := &questionsModels.Set{
		ID:     setID,
		UserId: userID,
	}

	deleted, err := s.setRepo.DeleteASet(qSet)
	if err != nil {
		return nil, fmt.Errorf("delete set: %w", err)
	}

	// Best-effort context deletion — set might not have a context row.
	_ = s.setRepo.DeleteSetContext(setID)

	return deleted, nil
}

// GetRecentSets returns the most recent sets for a user (owned + shared).
func (s *QuestionService) GetRecentSets(ctx context.Context, userID string, limit int) ([]*questionsModels.Set, error) {
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
	Set   questionsModels.Set `json:"set"`
	Owner users.User          `json:"owner"`
}

// GetSetContext retrieves the context for a set.
func (s *QuestionService) GetSetContext(ctx context.Context, setID string) (*questionsModels.SetContext, error) {
	sc, err := s.setRepo.GetSetContext(setID)
	if err != nil {
		return nil, fmt.Errorf("get set context: %w", err)
	}
	return sc, nil
}

// ---------------------------------------------------------------------------
// Shared Access
// ---------------------------------------------------------------------------

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
	if err := s.setRepo.AddSharedAccessUser(setID, userID); err != nil {
		return fmt.Errorf("allow set access: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

// GetAllQuestionsInASet checks access then returns all complete questions.
func (s *QuestionService) GetAllQuestionsInASet(ctx context.Context, userID, setID string) ([]questionsModels.CompleteQuestion, error) {
	_, err := s.AuthorizeSetAccess(ctx, userID, setID)
	if err != nil {
		return nil, err
	}

	questions, err := s.questionRepo.GetAllQuestionsInASet(setID)
	if err != nil {
		return nil, fmt.Errorf("get all questions: %w", err)
	}
	return questions, nil
}

// CreateSingleQuestion creates a question with its choices and answer in a set.
func (s *QuestionService) CreateSingleQuestion(
	ctx context.Context,
	question questionsModels.Question,
	choices []questionsModels.Choice,
	answer questionsModels.Answer,
	setID string,
) error {
	if err := s.questionRepo.CreateANewQuestionInASet(question, choices, answer, setID); err != nil {
		return fmt.Errorf("create question: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Batch Question Creation (shared by GenerateQuestionSet and SaveGeneratedQuestions)
// ---------------------------------------------------------------------------

// BatchCreateQuestionsInput is the input for batch question creation.
type BatchCreateQuestionsInput struct {
	Questions               []questionsModels.Question
	ChoicesWithQuestionType []questionsModels.ChoicesWithQuestionType
	AnswersWithQuestionInfo []questionsModels.AnswerWithQuestionInfo
}

// BatchCreateQuestions inserts questions, choices, and answers in batch.
// It assigns the returned question IDs to the choices and answers before insertion.
func (s *QuestionService) BatchCreateQuestions(ctx context.Context, input BatchCreateQuestionsInput) error {
	if len(input.Questions) != len(input.ChoicesWithQuestionType) {
		return fmt.Errorf("mismatched questions (%d) and choices (%d) length",
			len(input.Questions), len(input.ChoicesWithQuestionType))
	}

	qIDs, err := s.questionRepo.CreateQuestionsInBatchReturnIds(input.Questions)
	if err != nil {
		return fmt.Errorf("batch create questions: %w", err)
	}

	for i, qid := range qIDs {
		input.ChoicesWithQuestionType[i].QuestionId = qid
		input.AnswersWithQuestionInfo[i].QuestionId = qid
	}

	choicesMap, err := s.questionRepo.SaveChoicesInBatch(input.ChoicesWithQuestionType)
	if err != nil {
		return fmt.Errorf("batch save choices: %w", err)
	}

	if err := s.questionRepo.SaveAnswersInBatch(input.AnswersWithQuestionInfo, choicesMap); err != nil {
		return fmt.Errorf("batch save answers: %w", err)
	}

	return nil
}

// ---------------------------------------------------------------------------
// AI-Powered Question Generation
// ---------------------------------------------------------------------------

// GenerateQuestionSet calls the AI service, creates a new set with context,
// and batch-inserts all generated questions, choices, and answers.
// Returns the created set ID.
func (s *QuestionService) GenerateQuestionSet(
	ctx context.Context,
	userID string,
	numQuestions int,
	setContext string,
	questionType string,
) (string, error) {
	// 1. Call AI service
	gReq := &proto.GenerateQuestionsRequest{
		Quantity:     int32(numQuestions),
		Context:      setContext,
		QuestionType: questionType,
		Instructions: "",
	}
	resp, err := s.aiClient.GenerateQuestions(ctx, gReq)
	if err != nil {
		return "", fmt.Errorf("ai generate questions: %w", err)
	}

	// 2. Create set with context
	set := &questionsModels.Set{
		Visibility: "public",
		Title:      resp.Title,
		UserId:     userID,
	}
	setID, err := s.setRepo.CreateSetWithContextRetSetId(set, setContext)
	if err != nil {
		return "", fmt.Errorf("create set with context: %w", err)
	}

	// 3. Transform AI response into batch input
	input := buildBatchInputFromAIResponse(resp, setID)

	// 4. Batch insert
	if err := s.BatchCreateQuestions(ctx, input); err != nil {
		return "", fmt.Errorf("batch create after generation: %w", err)
	}

	return setID, nil
}

// SaveGeneratedQuestions creates a new set and batch-inserts pre-generated questions
// (used when the client has already generated questions and sends them for saving).
func (s *QuestionService) SaveGeneratedQuestions(
	ctx context.Context,
	userID string,
	title string,
	setContext string,
	questions []GeneratedQuestionInput,
) (string, error) {
	// 1. Create set with context
	set := &questionsModels.Set{
		Visibility: "public",
		Title:      title,
		UserId:     userID,
	}
	setID, err := s.setRepo.CreateSetWithContextRetSetId(set, setContext)
	if err != nil {
		return "", fmt.Errorf("create set with context: %w", err)
	}

	// 2. Transform client input into batch input
	input := buildBatchInputFromClientQuestions(questions, setID)

	// 3. Batch insert
	if err := s.BatchCreateQuestions(ctx, input); err != nil {
		return "", fmt.Errorf("batch create saved questions: %w", err)
	}

	return setID, nil
}

// GeneratedQuestionInput is the structure the client sends when saving
// pre-generated questions.
type GeneratedQuestionInput struct {
	Question questionsModels.Question `json:"question"`
	Answer   questionsModels.Answer   `json:"answer"`
	Choices  []questionsModels.Choice `json:"choices"`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func buildBatchInputFromAIResponse(resp *proto.GenerateQuestionsResponse, setID string) BatchCreateQuestionsInput {
	var (
		questions []questionsModels.Question
		cwqt      []questionsModels.ChoicesWithQuestionType
		awqi      []questionsModels.AnswerWithQuestionInfo
	)

	for _, que := range resp.Questions {
		q := questionsModels.Question{
			Question:     que.Question.Question,
			Difficulty:   que.Question.Difficulty,
			QuestionType: que.Question.QuestionType,
			SetId:        setID,
		}
		questions = append(questions, q)

		var choices []questionsModels.Choice
		for _, c := range que.Choices {
			choices = append(choices, questionsModels.Choice{ChoiceText: c.ChoiceText})
		}
		cwqt = append(cwqt, questionsModels.ChoicesWithQuestionType{
			Choices:      choices,
			QuestionType: que.Question.QuestionType,
		})

		awqi = append(awqi, questionsModels.AnswerWithQuestionInfo{
			QuestionType: que.Question.QuestionType,
			AnswerText:   que.Answer.Answer,
			Explanation:  que.Answer.Explanation,
		})
	}

	return BatchCreateQuestionsInput{
		Questions:               questions,
		ChoicesWithQuestionType: cwqt,
		AnswersWithQuestionInfo: awqi,
	}
}

func buildBatchInputFromClientQuestions(input []GeneratedQuestionInput, setID string) BatchCreateQuestionsInput {
	var (
		questions []questionsModels.Question
		cwqt      []questionsModels.ChoicesWithQuestionType
		awqi      []questionsModels.AnswerWithQuestionInfo
	)

	for _, gq := range input {
		q := questionsModels.Question{
			Question:     gq.Question.Question,
			Difficulty:   gq.Question.Difficulty,
			QuestionType: gq.Question.QuestionType,
			SetId:        setID,
		}
		questions = append(questions, q)

		var choices []questionsModels.Choice
		for _, c := range gq.Choices {
			choices = append(choices, questionsModels.Choice{ChoiceText: c.ChoiceText})
		}
		cwqt = append(cwqt, questionsModels.ChoicesWithQuestionType{
			Choices:      choices,
			QuestionType: gq.Question.QuestionType,
		})

		awqi = append(awqi, questionsModels.AnswerWithQuestionInfo{
			QuestionType: gq.Question.QuestionType,
			AnswerText:   gq.Answer.AnswerText,
			Explanation:  gq.Answer.Explanation,
		})
	}

	return BatchCreateQuestionsInput{
		Questions:               questions,
		ChoicesWithQuestionType: cwqt,
		AnswersWithQuestionInfo: awqi,
	}
}
