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

const (
	role_participant string = "participant"
	role_controller  string = "controller"
)

const (
	status_invited      string = "invited"
	status_joined       string = "joined"
	status_ready        string = "ready"
	status_taking_exam  string = "taking_exam"
	status_submitted    string = "submitted"
	status_disconnected string = "disconnected"
	status_terminated   string = "terminated"
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

func ValidateCreateExam(setID, visibility, title string, startTime time.Time, durationMinutes int) error {
	if setID == "" {
		return errs.NewBadRequestError("set_id is required", false, nil, nil, nil)
	}
	if visibility == "" {
		return errs.NewBadRequestError("visibility is required", false, nil, nil, nil)
	}
	if visibility != "public" && visibility != "private" && visibility != "restricted" {
		return errs.NewBadRequestError("visibility must be one of: public, private, restricted", false, nil, nil, nil)
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
func (s *ExamService) CreateExam(ctx context.Context, create *model.ExamCreate) error {
	if err := ValidateCreateExam(create.SetID, create.Visibility, create.Title, create.StartTime, create.DurationInMinutes); err != nil {
		return err
	}

	if err := s.examRepo.CreateExamOnASet(create); err != nil {
		return fmt.Errorf("create exam: %w", err)
	}
	return nil
}

func (s *ExamService) UpdateExam(ctx context.Context, update *model.ExamUpdate) error {
	if update.ID == "" {
		return errs.NewBadRequestError("exam_id is required", false, nil, nil, nil)
	}
	if update.UserID == "" {
		return errs.NewUnauthorizedError("Unauthorized", false)
	}

	if update.Title != nil && *update.Title == "" {
		return errs.NewBadRequestError("title cannot be empty", false, nil, nil, nil)
	}
	if update.DurationInMinutes != nil && *update.DurationInMinutes <= 0 {
		return errs.NewBadRequestError("duration_in_minutes must be greater than 0", false, nil, nil, nil)
	}
	if update.StartTime != nil && update.StartTime.Before(time.Now()) {
		return errs.NewBadRequestError("start_time must be in the future", false, nil, nil, nil)
	}
	if update.StartMode != nil && *update.StartMode != "lobby" && *update.StartMode != "timed" {
		return errs.NewBadRequestError("start_mode must be one of: lobby, timed", false, nil, nil, nil)
	}
	if update.SessionStatus != nil && *update.SessionStatus != "waiting" && *update.SessionStatus != "live" && *update.SessionStatus != "finished" {
		return errs.NewBadRequestError("session_status must be one of: waiting, live, finished", false, nil, nil, nil)
	}

	if err := s.examRepo.UpdateExam(update); err != nil {
		if err.Error() == "exam not found" {
			return errs.NewNotFoundError("Exam not found", false, nil)
		}
		if err.Error() == "no fields to update" {
			return errs.NewBadRequestError("at least one field is required to update", false, nil, nil, nil)
		}
		return fmt.Errorf("update exam: %w", err)
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
func (s *ExamService) RemoveExam(ctx context.Context, userID, examID string) error {
	if err := s.examRepo.RemoveExam(userID, examID); err != nil {
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
	examsList, err := s.examRepo.GetExamsListBySetId(setID)
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

// // GetExams returns exams filtered by set_id (if provided) or all user exams.
// func (s *ExamService) GetExams(ctx context.Context, userID, setID string) ([]model.Exam, error) {
// 	if setID == "" {
// 		return s.GetExamsByUserID(ctx, userID)
// 	}
// 	return s.GetExamsBySetID(ctx, setID)
// }

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

// JoinExam registers a participant for an exam.
// Rules:
// - private: only set owner/shared-access users can join, as participant
// - public: anyone can join; owner/shared-access users are controller, others participant
// - restricted: currently same as public until invite-list logic is added
func (s *ExamService) JoinExam(ctx context.Context, userID, examID string) (*model.ExamJoinInfo, error) {
	if examID == "" {
		return nil, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil)
	}

	exam, err := s.examRepo.GetExamByExamId(examID)
	if err != nil {
		if err.Error() == "exam not found" {
			return nil, errs.NewNotFoundError("Exam not found", false, nil)
		}
		return nil, fmt.Errorf("join exam: get exam: %w", err)
	}

	if exam.SessionStatus == "finished" {
		return nil, errs.NewBadRequestError("exam already finished", false, nil, nil, nil)
	}

	setAccess, err := s.getSetAccessForUser(exam, userID)
	if err != nil {
		return nil, err
	}
	var role string
	switch exam.Visibility {
	case "private":
		// users with set access can attend friendly-exam
		// as being participant for group practice
		if !setAccess.HasSetAccess {
			return nil, errs.NewForbiddenError("you are not allowed to join this private exam", false)
		}

		role = role_participant
		if err := s.examRepo.UpsertExamParticipant(examID, userID, status_joined, role_participant); err != nil {
			return nil, fmt.Errorf("join exam: upsert participant: %w", err)
		}
	case "restricted":
		if setAccess.HasSetAccess {
			role = role_controller
			if err := s.examRepo.UpsertExamParticipant(examID, userID, status_joined, role_controller); err != nil {
				return nil, fmt.Errorf("join exam: upsert controller: %w", err)
			}
		} else {
			status, err := s.examRepo.GetExamParticipantStatus(examID, userID)
			if err != nil && status != "not_found" {
				return nil, fmt.Errorf("join exam: get participant status: %w", err)
			}
			// user was invited
			if status == status_invited {
				role = role_participant
				if err := s.examRepo.UpsertExamParticipant(examID, userID, status_joined, role_participant); err != nil {
					return nil, fmt.Errorf("join exam: upsert invited participant: %w", err)
				}
			} else {
				return nil, errs.NewForbiddenError("you are not allowed to join this restricted exam", false)
			}
		}
	case "public":
		if setAccess.HasSetAccess {
			role = role_controller
			if err := s.examRepo.UpsertExamParticipant(examID, userID, status_joined, role_controller); err != nil {
				return nil, fmt.Errorf("join exam: upsert controller: %w", err)
			}
		} else {
			role = role_participant
			if err := s.examRepo.UpsertExamParticipant(examID, userID, status_joined, role_participant); err != nil {
				return nil, fmt.Errorf("join exam: upsert participant: %w", err)
			}
		}
	default:
		return nil, errs.NewBadRequestError("invalid exam visibility", false, nil, nil, nil)
	}

	return &model.ExamJoinInfo{
		ExamID:    examID,
		Role:      role,
		Status:    exam.SessionStatus,
		StartTime: exam.StartTime,
		EndTime:   exam.EndTime,
	}, nil
}

func (s *ExamService) getSetAccessForUser(exam model.Exam, userID string) (*model.SetAccessDetailsUser, error) {

	ownerID, err := s.setRepo.GetOwnerUserId(exam.SetId)
	if err != nil {
		return nil, fmt.Errorf("join exam: get set owner: %w", err)
	}

	sharedUsers, err := s.setRepo.GetSharedAccessUsersList(exam.SetId)
	if err != nil {
		return nil, fmt.Errorf("join exam: check set access: %w", err)
	}

	// user is the owner
	if ownerID == userID {
		return &model.SetAccessDetailsUser{
			OwnerID:      ownerID,
			SharedUsers:  sharedUsers,
			HasSetAccess: true,
		}, nil
	}

	// user in shared users list
	for _, user := range sharedUsers {
		if userID == user.ID {
			return &model.SetAccessDetailsUser{
				OwnerID:      ownerID,
				SharedUsers:  sharedUsers,
				HasSetAccess: true,
			}, nil
		}
	}

	// user has no access to this set
	return &model.SetAccessDetailsUser{
		OwnerID:      ownerID,
		SharedUsers:  sharedUsers,
		HasSetAccess: false,
	}, nil
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

// func (s* ExamService) SubmitExam
