package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/internal/users"
	"github.com/rs/zerolog"
)

type ExamService struct {
	examRepo     *repository.ExamRepository
	setRepo      *repository.SetRepository
	questionRepo *repository.QuestionRepository
	userRepo     *repository.UserRepository
	log          zerolog.Logger
}

func NewExamService(
	examRepo *repository.ExamRepository,
	setRepo *repository.SetRepository,
	questionRepo *repository.QuestionRepository,
	userRepo *repository.UserRepository,
	log zerolog.Logger,
) *ExamService {
	return &ExamService{
		examRepo:     examRepo,
		setRepo:      setRepo,
		questionRepo: questionRepo,
		userRepo:     userRepo,
		log:          log,
	}
}

func ValidateCreateExam(setID, title string, startTime time.Time, durationMinutes int) error {
	if setID == "" {
		return errs.NewBadRequestError("set_id is required", false, nil, nil, nil)
	}
	if title == "" {
		return errs.NewBadRequestError("title is required", false, nil, nil, nil)
	}
	if durationMinutes <= 0 {
		return errs.NewBadRequestError("duration_in_minutes must be greater than 0", false, nil, nil, nil)
	}
	if startTime.Before(time.Now()) {
		return errs.NewBadRequestError("start_time must be in the future", false, nil, nil, nil)
	}
	return nil
}

// CreateExam validates and creates an exam on a set.
func (s *ExamService) CreateExam(
	ctx context.Context,
	userID, setID, title, description string,
	startTime time.Time,
	durationMinutes int,
	startMode, sessionStatus, inviteCode string,
	proctoringEnabled, cameraRequired bool,
) error {
	if err := ValidateCreateExam(setID, title, startTime, durationMinutes); err != nil {
		return err // already an *errs.HTTPError
	}

	if err := s.examRepo.CreateExamOnASet(
		userID,
		setID,
		title,
		description,
		startTime,
		durationMinutes,
		startMode,
		sessionStatus,
		inviteCode,
		proctoringEnabled,
		cameraRequired,
	); err != nil {
		return fmt.Errorf("create exam: %w", err)
	}
	return nil
}

// GetExamByID returns a single exam by its ID.
func (s *ExamService) GetExamByID(ctx context.Context, examID string) (model.Exam, error) {
	exam, err := s.examRepo.GetExamByExamId(examID)
	if err != nil {
		if err.Error() == "exam not found" {
			return model.Exam{}, errs.NewNotFoundError("Exam not found", false, nil)
		}
		return model.Exam{}, fmt.Errorf("get exam by id: %w", err)
	}
	return exam, nil
}

// RemoveExam deletes an exam by ID.
func (s *ExamService) RemoveExam(ctx context.Context, examID string) error {
	if err := s.examRepo.RemoveExam(examID); err != nil {
		// The repository returns "exam not found" when no rows were affected.
		if err.Error() == "exam not found" {
			return errs.NewNotFoundError("Exam not found", false, nil)
		}
		return fmt.Errorf("remove exam: %w", err)
	}
	return nil
}

// GetExamsBySetID returns exams for a set, enriched with the CreatedBy user.
func (s *ExamService) GetExamsBySetID(ctx context.Context, setID string) ([]model.Exam, error) {
	examsList, err := s.examRepo.GetExamsBySetId(setID)
	if err != nil {
		return nil, fmt.Errorf("get exams by set: %w", err)
	}

	for i := range examsList {
		user, err := s.userRepo.GetUserFromId(examsList[i].UserId)
		if err != nil {
			// Non-fatal: log and continue with zero-value user.
			continue
		}
		examsList[i].CreatedBy = user
	}

	return examsList, nil
}

// GetExamsByUserID returns all exams created by a user, enriched with set info.
func (s *ExamService) GetExamsByUserID(ctx context.Context, userID string) ([]model.Exam, error) {
	examsList, err := s.examRepo.GetExamsListByUserId(userID)
	if err != nil {
		return nil, fmt.Errorf("get exams by user: %w", err)
	}
	return examsList, nil
}

// GetExams returns exams filtered by set_id (if provided) or all user exams.
func (s *ExamService) GetExams(ctx context.Context, userID, setID string) ([]model.Exam, error) {
	if setID == "" {
		return s.GetExamsByUserID(ctx, userID)
	}
	return s.GetExamsBySetID(ctx, setID)
}

// GetQuestionsOfExam returns all questions belonging to the exam's set.
func (s *ExamService) GetQuestionsOfExam(ctx context.Context, examID string) ([]model.QuestionWithAnswer, error) {
	setID, err := s.examRepo.GetExamSetId(examID)
	if err != nil {
		return nil, fmt.Errorf("get exam set id: %w", err)
	}

	questions, err := s.questionRepo.GetQuestionsBySetID(setID)
	if err != nil {
		return nil, fmt.Errorf("get questions for exam: %w", err)
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
		return nil, fmt.Errorf("get choices for exam questions: %w", err)
	}

	answersMap, err := s.questionRepo.GetAnswersForQuestions(questionIDs)
	if err != nil {
		return nil, fmt.Errorf("get answers for exam questions: %w", err)
	}

	results := make([]model.QuestionWithAnswer, 0, len(questions))
	for _, q := range questions {
		results = append(results, model.QuestionWithAnswer{
			Question: q,
			Choices:  choicesMap[q.Id],
			Answer:   answersMap[q.Id],
		})
	}

	return results, nil
}

// GetSubmissionResult retrieves the evaluation result for a user's exam submission.
func (s *ExamService) GetSubmissionResult(ctx context.Context, examID, userID string) (*model.EvaluationResult, error) {
	result, err := s.examRepo.GetEvaluationResult(examID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.NewNotFoundError("No submission found for this exam", false, nil)
		}
		return nil, fmt.Errorf("get evaluation result: %w", err)
	}
	return result, nil
}

// DetermineClientType decides whether a user joining an exam room is a
// "monitor" (can observe) or "participant" (takes the exam).
func (s *ExamService) DetermineClientType(ctx context.Context, userID, examID string) string {
	const (
		monitor     = "monitor"
		participant = "participant"
	)

	exam, err := s.examRepo.GetExamByExamId(examID)
	if err != nil {
		return participant
	}

	// Private visibility: always participant.
	if exam.Visibility == "private" {
		return participant
	}

	// Public visibility: owner or shared-access → monitor, otherwise → participant.
	if exam.Visibility == "public" {
		ownerID, err := s.setRepo.GetOwnerUserId(exam.SetId)
		if err != nil {
			return participant
		}
		if ownerID == userID {
			return monitor
		}
		hasAccess, _ := s.setRepo.CheckUserAccess(userID, exam.SetId)
		if hasAccess {
			return monitor
		}
		return participant
	}

	// Restricted visibility: participant by default.
	return participant
}

// ExamExists checks if an exam exists.
func (s *ExamService) ExamExists(ctx context.Context, examID string) error {
	return s.examRepo.IsExamExists(examID)
}

// EnrichExamsWithCreatedBy adds the CreatedBy user info to each exam.
func (s *ExamService) EnrichExamsWithCreatedBy(examsList []model.Exam) {
	for i := range examsList {
		user, err := s.userRepo.GetUserFromId(examsList[i].UserId)
		if err != nil {
			examsList[i].CreatedBy = users.User{}
			continue
		}
		examsList[i].CreatedBy = user
	}
}
