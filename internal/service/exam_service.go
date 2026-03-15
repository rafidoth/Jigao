package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/exams/models"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/internal/users"
)

type ExamService struct {
	examRepo     *repository.ExamRepository
	setRepo      *repository.SetRepository
	questionRepo *repository.QuestionRepository
	userRepo     *repository.UserRepository
	hub          *exams.ExamHub
}

func NewExamService(
	examRepo *repository.ExamRepository,
	setRepo *repository.SetRepository,
	questionRepo *repository.QuestionRepository,
	userRepo *repository.UserRepository,
	hub *exams.ExamHub,
) *ExamService {
	return &ExamService{
		examRepo:     examRepo,
		setRepo:      setRepo,
		questionRepo: questionRepo,
		userRepo:     userRepo,
		hub:          hub,
	}
}

// ValidateCreateExam checks business rules for creating an exam.
func ValidateCreateExam(setID, title string, startTime time.Time, durationMinutes int) error {
	if setID == "" {
		return errors.New("set_id is required")
	}
	if title == "" {
		return errors.New("title is required")
	}
	if durationMinutes <= 0 {
		return errors.New("duration_in_minutes must be greater than 0")
	}
	if startTime.Before(time.Now()) {
		return errors.New("start_time must be in the future")
	}
	return nil
}

// ---------------------------------------------------------------------------
// Exam CRUD
// ---------------------------------------------------------------------------

// CreateExam validates and creates an exam on a set.
func (s *ExamService) CreateExam(
	ctx context.Context,
	userID, setID, title, description string,
	startTime time.Time,
	durationMinutes int,
) error {
	if err := ValidateCreateExam(setID, title, startTime, durationMinutes); err != nil {
		return fmt.Errorf("validation: %w", err)
	}

	if err := s.examRepo.CreateExamOnASet(userID, setID, title, description, startTime, durationMinutes); err != nil {
		return fmt.Errorf("create exam: %w", err)
	}
	return nil
}

// GetExamByID returns a single exam by its ID.
func (s *ExamService) GetExamByID(ctx context.Context, examID string) (models.Exam, error) {
	exam, err := s.examRepo.GetExamByExamId(examID)
	if err != nil {
		return models.Exam{}, fmt.Errorf("get exam by id: %w", err)
	}
	return exam, nil
}

// RemoveExam deletes an exam by ID.
func (s *ExamService) RemoveExam(ctx context.Context, examID string) error {
	if err := s.examRepo.RemoveExam(examID); err != nil {
		return fmt.Errorf("remove exam: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Exam Listing with Enrichment
// ---------------------------------------------------------------------------

// GetExamsBySetID returns exams for a set, enriched with the CreatedBy user.
func (s *ExamService) GetExamsBySetID(ctx context.Context, setID string) ([]models.Exam, error) {
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
func (s *ExamService) GetExamsByUserID(ctx context.Context, userID string) ([]models.Exam, error) {
	examsList, err := s.examRepo.GetExamsListByUserId(userID)
	if err != nil {
		return nil, fmt.Errorf("get exams by user: %w", err)
	}
	return examsList, nil
}

// GetExams returns exams filtered by set_id (if provided) or all user exams.
func (s *ExamService) GetExams(ctx context.Context, userID, setID string) ([]models.Exam, error) {
	if setID == "" {
		return s.GetExamsByUserID(ctx, userID)
	}
	return s.GetExamsBySetID(ctx, setID)
}

// ---------------------------------------------------------------------------
// Exam Questions
// ---------------------------------------------------------------------------

// GetQuestionsOfExam returns all questions belonging to the exam's set.
func (s *ExamService) GetQuestionsOfExam(ctx context.Context, examID string) ([]questionsModels.CompleteQuestion, error) {
	setID, err := s.examRepo.GetExamSetId(examID)
	if err != nil {
		return nil, fmt.Errorf("get exam set id: %w", err)
	}

	questions, err := s.questionRepo.GetAllQuestionsInASet(setID)
	if err != nil {
		return nil, fmt.Errorf("get questions for exam: %w", err)
	}
	return questions, nil
}

// ---------------------------------------------------------------------------
// Submission & Evaluation
// ---------------------------------------------------------------------------

// GetSubmissionResult retrieves the evaluation result for a user's exam submission.
func (s *ExamService) GetSubmissionResult(ctx context.Context, examID, userID string) (*models.EvaluationResult, error) {
	result, err := s.examRepo.GetEvaluationResult(examID, userID)
	if err != nil {
		return nil, fmt.Errorf("get evaluation result: %w", err)
	}
	return result, nil
}

// ---------------------------------------------------------------------------
// WebSocket / Room Logic
// ---------------------------------------------------------------------------

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

// EnsureRoomExists makes sure a room exists for the given exam ID.
// If no room exists and the exam is valid, it creates one.
func (s *ExamService) EnsureRoomExists(ctx context.Context, roomID string) error {
	room := s.hub.GetRoom(roomID)
	if room != nil {
		return nil // room already exists
	}

	// Verify the exam exists before creating a room.
	if err := s.examRepo.IsExamExists(roomID); err != nil {
		return fmt.Errorf("exam not found: %w", err)
	}

	if err := s.hub.CreateNewRoom(roomID); err != nil {
		return fmt.Errorf("create room: %w", err)
	}
	return nil
}

// GetHub returns the ExamHub reference (needed by the WebSocket handler).
func (s *ExamService) GetHub() *exams.ExamHub {
	return s.hub
}

// ExamExists checks if an exam exists.
func (s *ExamService) ExamExists(ctx context.Context, examID string) error {
	return s.examRepo.IsExamExists(examID)
}

// ---------------------------------------------------------------------------
// User enrichment helper
// ---------------------------------------------------------------------------

// EnrichExamsWithCreatedBy adds the CreatedBy user info to each exam.
func (s *ExamService) EnrichExamsWithCreatedBy(examsList []models.Exam) {
	for i := range examsList {
		user, err := s.userRepo.GetUserFromId(examsList[i].UserId)
		if err != nil {
			examsList[i].CreatedBy = users.User{}
			continue
		}
		examsList[i].CreatedBy = user
	}
}
