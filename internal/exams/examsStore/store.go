package examsStore

import (
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rafidoth/onlyexams/internal/exams"
)

type Store struct {
	db *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store {
	return &Store{
		db: pool,
	}
}

// Ensure Store implements exams.HubStorage
var _ exams.HubStorage = (*Store)(nil)

// EvaluateSubmittedExam receives a synthetic submissionId in the form "examID:userID"
// and triggers evaluation by splitting and delegating to EvaluateSubmission.
func (s Store) EvaluateSubmittedExam(submissionId string) error {
	parts := strings.SplitN(submissionId, ":", 2)
	if len(parts) != 2 {
		return nil
	}
	return s.EvaluateSubmission(parts[0], parts[1])
}
