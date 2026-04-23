package service

import (
	"fmt"

	"github.com/rafidoth/onlyexams/internal/errs"
)

// UpdateExamDraft merges incoming answer delta with existing draft and persists full draft.
// answers payload should contain only updated selections.
// Empty value ("") means clear that question key from draft.
func (s *ExamService) UpdateExamDraft(examID, userID string, answers map[string]string) error {
	if examID == "" {
		return errs.NewBadRequestError("exam_id is required", false, nil, nil, nil)
	}

	if userID == "" {
		return errs.NewUnauthorizedError("Unauthorized", false)
	}

	if len(answers) == 0 {
		return errs.NewBadRequestError("answers is required", false, nil, nil, nil)
	}

	for questionID := range answers {
		if questionID == "" {
			return errs.NewBadRequestError("answers contains empty question_id", false, nil, nil, nil)
		}
	}

	existingDraft, err := s.examRepo.GetExamAnswerDraft(examID, userID)
	if err != nil {
		return fmt.Errorf("get exam draft: %w", err)
	}

	mergedDraft := make(map[string]string, len(existingDraft)+len(answers))
	for questionID, answer := range existingDraft {
		mergedDraft[questionID] = answer
	}

	for questionID, answer := range answers {
		if answer == "" {
			delete(mergedDraft, questionID)
			continue
		}
		mergedDraft[questionID] = answer
	}

	if err := s.examRepo.UpsertExamAnswerDrafts(examID, userID, mergedDraft); err != nil {
		return fmt.Errorf("upsert exam draft: %w", err)
	}

	return nil
}
