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
