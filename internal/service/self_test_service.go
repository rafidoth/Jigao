package service

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rs/zerolog"
)

type SelfTestService struct {
	selfTestRepo *repository.SelfTestRepository
	questionRepo *repository.QuestionRepository
	log          zerolog.Logger
}

func NewSelfTestService(
	selfTestRepo *repository.SelfTestRepository,
	questionRepo *repository.QuestionRepository,
	log zerolog.Logger,
) *SelfTestService {
	return &SelfTestService{
		selfTestRepo: selfTestRepo,
		questionRepo: questionRepo,
		log:          log,
	}
}

func (s *SelfTestService) SubmitSelfTest(ctx context.Context, userID string, req *model.SelfTestSubmissionRequest) (*model.SelfTestSubmissionResult, error) {
	if strings.TrimSpace(req.SetID) == "" {
		return nil, errs.NewBadRequestError("set_id is required", false, nil, nil, nil)
	}
	if len(req.SetID) != 36 {
		return nil, errs.NewBadRequestError("set_id must be a valid UUID", false, nil, nil, nil)
	}
	if req.DurationInMinutes <= 0 || req.DurationInMinutes > 300 {
		return nil, errs.NewBadRequestError("duration_in_minutes must be between 1 and 300", false, nil, nil, nil)
	}
	if req.TimeTakenSeconds < 0 {
		return nil, errs.NewBadRequestError("time_taken_seconds cannot be negative", false, nil, nil, nil)
	}
	if req.Answers == nil {
		return nil, errs.NewBadRequestError("answers is required", false, nil, nil, nil)
	}

	setExists, hasAccess, err := s.selfTestRepo.CheckSetAccessOrExistence(ctx, req.SetID, userID)
	if err != nil {
		return nil, fmt.Errorf("check set access: %w", err)
	}
	if !setExists {
		return nil, errs.NewNotFoundError("Set not found", false, nil)
	}
	if !hasAccess {
		return nil, errs.NewForbiddenError("You do not have access to this set", false)
	}

	questions, err := s.questionRepo.GetQuestionsBySetID(req.SetID)
	if err != nil {
		return nil, fmt.Errorf("get set questions: %w", err)
	}
	if len(questions) == 0 {
		return nil, errs.NewBadRequestError("set has no questions", false, nil, nil, nil)
	}

	questionIDs := make([]string, len(questions))
	questionByID := make(map[string]model.Question, len(questions))
	for i, q := range questions {
		questionIDs[i] = q.Id
		questionByID[q.Id] = q
	}

	for questionID := range req.Answers {
		q, ok := questionByID[questionID]
		if !ok {
			return nil, errs.NewBadRequestError("answers contains question not found in set", false, nil, nil, nil)
		}
		if err := validateSelfTestAnswer(q.QuestionType, req.Answers[questionID]); err != nil {
			return nil, err
		}
	}

	answersMap, err := s.questionRepo.GetAnswersForQuestions(questionIDs)
	if err != nil {
		return nil, fmt.Errorf("get correct answers for set questions: %w", err)
	}

	correctCount := 0
	gradableCount := 0
	for _, q := range questions {
		if q.QuestionType == "short_question" {
			continue
		}

		gradableCount++

		userAnswer, answered := req.Answers[q.Id]
		if !answered {
			continue
		}

		correctAnswer, ok := answersMap[q.Id]
		if !ok {
			continue
		}

		if isSelfTestAnswerCorrect(q.QuestionType, userAnswer, correctAnswer.CorrectAnswer) {
			correctCount++
		}
	}

	maxSeconds := req.DurationInMinutes * 60
	if req.TimeTakenSeconds > maxSeconds {
		req.TimeTakenSeconds = maxSeconds
	}

	record := &model.SelfTestRecord{
		UserID:            userID,
		SetID:             req.SetID,
		DurationInMinutes: req.DurationInMinutes,
		TimeTakenSeconds:  req.TimeTakenSeconds,
		Answers:           req.Answers,
		CorrectCount:      correctCount,
		QuestionCount:     len(questions),
	}

	id, createdAt, err := s.selfTestRepo.CreateSelfTestSubmission(ctx, record)
	if err != nil {
		return nil, fmt.Errorf("create self test submission: %w", err)
	}

	return &model.SelfTestSubmissionResult{
		SelfTestID:    id,
		CorrectCount:  correctCount,
		QuestionCount: len(questions),
		GradableCount: gradableCount,
		CreatedAt:     createdAt,
	}, nil
}

func validateSelfTestAnswer(questionType string, answer model.SelfTestAnswer) error {
	hasMCQ := answer.MCQSelectedPosition != nil
	hasTF := answer.TFSelected != nil
	hasFIB := answer.FIBAnswer != nil
	hasSQ := answer.SQAnswer != nil

	fieldsCount := 0
	if hasMCQ {
		fieldsCount++
	}
	if hasTF {
		fieldsCount++
	}
	if hasFIB {
		fieldsCount++
	}
	if hasSQ {
		fieldsCount++
	}

	if fieldsCount == 0 {
		return errs.NewBadRequestError("each answer must contain exactly one answer field", false, nil, nil, nil)
	}
	if fieldsCount > 1 {
		return errs.NewBadRequestError("each answer must contain exactly one answer field", false, nil, nil, nil)
	}

	switch questionType {
	case "multiple_choice_questions":
		if !hasMCQ {
			return errs.NewBadRequestError("mcq_selected_position is required for multiple choice questions", false, nil, nil, nil)
		}
		if *answer.MCQSelectedPosition <= 0 {
			return errs.NewBadRequestError("mcq_selected_position must be greater than 0", false, nil, nil, nil)
		}
	case "true_false":
		if !hasTF {
			return errs.NewBadRequestError("tf_selected is required for true/false questions", false, nil, nil, nil)
		}
	case "fill_in_the_blanks":
		if !hasFIB {
			return errs.NewBadRequestError("fib_answer is required for fill in the blanks questions", false, nil, nil, nil)
		}
	case "short_question":
		if !hasSQ {
			return errs.NewBadRequestError("sq_answer is required for short questions", false, nil, nil, nil)
		}
	default:
		return errs.NewBadRequestError("unsupported question type in answers", false, nil, nil, nil)
	}

	return nil
}

func isSelfTestAnswerCorrect(questionType string, answer model.SelfTestAnswer, correct model.CorrectAnswer) bool {
	switch questionType {
	case "multiple_choice_questions":
		if answer.MCQSelectedPosition == nil {
			return false
		}
		return *answer.MCQSelectedPosition == correct.MCQ_CorrectChoicePosition
	case "true_false":
		if answer.TFSelected == nil || correct.TF_CorrectChoice == nil {
			return false
		}
		return *answer.TFSelected == *correct.TF_CorrectChoice
	case "fill_in_the_blanks":
		if answer.FIBAnswer == nil {
			return false
		}

		userAns := strings.TrimSpace(*answer.FIBAnswer)
		for _, accepted := range correct.FIB_AcceptedAnswers {
			acceptedNorm := strings.TrimSpace(accepted)
			if correct.FIB_CaseSensitive {
				if userAns == acceptedNorm {
					return true
				}
				continue
			}
			if strings.EqualFold(userAns, acceptedNorm) {
				return true
			}
		}
		return false
	default:
		return false
	}
}

// GetSelfTestResult fetches a self-test result with detailed question results.
func (s *SelfTestService) GetSelfTestResult(ctx context.Context, userID, selfTestID string) (*model.SelfTestResultResponse, error) {
	if strings.TrimSpace(selfTestID) == "" {
		return nil, errs.NewBadRequestError("self_test_id is required", false, nil, nil, nil)
	}
	if len(selfTestID) != 36 {
		return nil, errs.NewBadRequestError("self_test_id must be a valid UUID", false, nil, nil, nil)
	}

	// Fetch the self-test record
	selfTest, err := s.selfTestRepo.GetSelfTestByID(ctx, selfTestID, userID)
	if err != nil {
		if strings.Contains(err.Error(), pgx.ErrNoRows.Error()) {
			return nil, errs.NewNotFoundError("Self test not found", false, nil)
		}
		return nil, fmt.Errorf("get self test: %w", err)
	}

	// Fetch set title
	setTitle, err := s.selfTestRepo.GetSetTitle(ctx, selfTest.SetID)
	if err != nil {
		return nil, fmt.Errorf("get set title: %w", err)
	}

	// Fetch all questions for the set
	questions, err := s.questionRepo.GetQuestionsBySetID(selfTest.SetID)
	if err != nil {
		return nil, fmt.Errorf("get questions: %w", err)
	}

	if len(questions) == 0 {
		return &model.SelfTestResultResponse{
			SelfTestID:        selfTest.ID,
			SetID:             selfTest.SetID,
			SetTitle:          setTitle,
			DurationInMinutes: selfTest.DurationInMinutes,
			TimeTakenSeconds:  selfTest.TimeTakenSeconds,
			CorrectCount:      selfTest.CorrectCount,
			QuestionCount:     selfTest.QuestionCount,
			GradableCount:     0,
			CreatedAt:         selfTest.CreatedAt,
			Questions:         []model.SelfTestQuestionResult{},
		}, nil
	}

	// Collect question IDs
	questionIDs := make([]string, len(questions))
	for i, q := range questions {
		questionIDs[i] = q.Id
	}

	// Fetch choices and answers
	choicesMap, err := s.questionRepo.GetChoicesForQuestions(questionIDs)
	if err != nil {
		return nil, fmt.Errorf("get choices: %w", err)
	}

	answersMap, err := s.questionRepo.GetAnswersForQuestions(questionIDs)
	if err != nil {
		return nil, fmt.Errorf("get answers: %w", err)
	}

	// Build question results
	questionResults := make([]model.SelfTestQuestionResult, 0, len(questions))
	gradableCount := 0

	for _, q := range questions {
		answer, hasAnswer := answersMap[q.Id]
		if !hasAnswer {
			continue
		}

		// Sort choices by position
		choices := choicesMap[q.Id]
		sort.Slice(choices, func(i, j int) bool {
			return choices[i].Position < choices[j].Position
		})

		// Build ChoiceResponse slice
		var choiceResponses []model.ChoiceResponse
		if len(choices) > 0 {
			choiceResponses = make([]model.ChoiceResponse, len(choices))
			for i, c := range choices {
				choiceResponses[i] = model.ChoiceResponse{
					ChoiceID: c.Id,
					Text:     c.ChoiceText,
					Position: c.Position,
				}
			}
		}

		// Build AnswerResponse (correct answer)
		answerResp := model.AnswerResponse{
			Explanation: answer.Explanation,
		}

		switch q.QuestionType {
		case "multiple_choice_questions":
			answerResp.CorrectChoicePosition = answer.CorrectAnswer.MCQ_CorrectChoicePosition
			for _, c := range choices {
				if c.Position == answer.CorrectAnswer.MCQ_CorrectChoicePosition {
					answerResp.CorrectChoiceID = c.Id
					break
				}
			}
		case "true_false":
			answerResp.CorrectBool = answer.CorrectAnswer.TF_CorrectChoice
		case "fill_in_the_blanks":
			answerResp.AcceptedAnswers = answer.CorrectAnswer.FIB_AcceptedAnswers
			answerResp.CaseSensitive = answer.CorrectAnswer.FIB_CaseSensitive
		case "short_question":
			answerResp.ModelAnswer = answer.CorrectAnswer.SQ_ModelAnswer
		}

		// Build UserAnswerResponse
		var userAnswerResp *model.UserAnswerResponse
		userAnswer, answered := selfTest.Answers[q.Id]
		if answered {
			userAnswerResp = &model.UserAnswerResponse{}

			switch q.QuestionType {
			case "multiple_choice_questions":
				if userAnswer.MCQSelectedPosition != nil {
					userAnswerResp.SelectedChoicePosition = *userAnswer.MCQSelectedPosition
					// Find the choice ID for this position
					for _, c := range choices {
						if c.Position == *userAnswer.MCQSelectedPosition {
							userAnswerResp.SelectedChoiceID = c.Id
							break
						}
					}
				}
			case "true_false":
				userAnswerResp.SelectedBool = userAnswer.TFSelected
			case "fill_in_the_blanks":
				if userAnswer.FIBAnswer != nil {
					userAnswerResp.TextAnswer = *userAnswer.FIBAnswer
				}
			case "short_question":
				if userAnswer.SQAnswer != nil {
					userAnswerResp.TextAnswer = *userAnswer.SQAnswer
				}
			}
		}

		// Compute is_correct
		var isCorrect *bool
		if q.QuestionType != "short_question" {
			gradableCount++
			if answered {
				correct := isSelfTestAnswerCorrect(q.QuestionType, userAnswer, answer.CorrectAnswer)
				isCorrect = &correct
			} else {
				incorrect := false
				isCorrect = &incorrect
			}
		}
		// For short_question, isCorrect remains nil (not graded)

		questionResults = append(questionResults, model.SelfTestQuestionResult{
			QuestionID: q.Id,
			AnswerID:   answer.Id,
			Text:       q.Question,
			Type:       q.QuestionType,
			Difficulty: q.Difficulty,
			Choices:    choiceResponses,
			Answer:     answerResp,
			UserAnswer: userAnswerResp,
			IsCorrect:  isCorrect,
		})
	}

	return &model.SelfTestResultResponse{
		SelfTestID:        selfTest.ID,
		SetID:             selfTest.SetID,
		SetTitle:          setTitle,
		DurationInMinutes: selfTest.DurationInMinutes,
		TimeTakenSeconds:  selfTest.TimeTakenSeconds,
		CorrectCount:      selfTest.CorrectCount,
		QuestionCount:     selfTest.QuestionCount,
		GradableCount:     gradableCount,
		CreatedAt:         selfTest.CreatedAt,
		Questions:         questionResults,
	}, nil
}

// GetRecentSelfTests fetches the most recent self-tests for a user.
func (s *SelfTestService) GetRecentSelfTests(ctx context.Context, userID string, limit int) ([]model.SelfTestListItem, error) {
	if limit <= 0 {
		limit = 5
	}
	if limit > 100 {
		limit = 100
	}

	items, err := s.selfTestRepo.GetRecentSelfTests(ctx, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("get recent self tests: %w", err)
	}

	if items == nil {
		items = []model.SelfTestListItem{}
	}

	return items, nil
}

// GetSelfTestsBySetID fetches the most recent self-tests for a user filtered by set ID.
func (s *SelfTestService) GetSelfTestsBySetID(ctx context.Context, userID, setID string, limit int) ([]model.SelfTestListItem, error) {
	if strings.TrimSpace(setID) == "" {
		return nil, errs.NewBadRequestError("set_id is required", false, nil, nil, nil)
	}
	if len(setID) != 36 {
		return nil, errs.NewBadRequestError("set_id must be a valid UUID", false, nil, nil, nil)
	}

	if limit <= 0 {
		limit = 5
	}
	if limit > 100 {
		limit = 100
	}

	items, err := s.selfTestRepo.GetSelfTestsBySetID(ctx, userID, setID, limit)
	if err != nil {
		return nil, fmt.Errorf("get self tests by set id: %w", err)
	}

	if items == nil {
		items = []model.SelfTestListItem{}
	}

	return items, nil
}
