package questionsStore

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"testing"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

func setupStore(t *testing.T) *Store {
	t.Helper()
	// Use os.Getenv("TEST_DB_URL") instead for production use.
	// os.Getenv("TEST_DB_URL")
	TEST_DBSTRING := "postgresql://neondb_owner:npg_ChJZFK5U3xGW@ep-wandering-star-a1q4f21q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
	if TEST_DBSTRING == "" {
		t.Skip("TEST_DBSTRING is not set")
	}

	conn, err := pgxpool.New(context.Background(), TEST_DBSTRING)
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}

	t.Cleanup(func() {
		conn.Close()
	})

	return New(conn)
}

func cleanupQuestions(t *testing.T, s *Store, ids []string) {
	t.Helper()
	if len(ids) == 0 {
		return
	}

	inClause := ""
	for _, id := range ids {
		inClause += fmt.Sprintf("'%s',", id)
	}
	inClause = inClause[:len(inClause)-1]
	deleteSQL := fmt.Sprintf("DELETE FROM questions WHERE id IN (%s)", inClause)

	// We assume the store has access to the pool to run raw commands for cleanup
	_, err := s.db.Exec(context.Background(), deleteSQL)
	if err != nil {
		t.Logf("Warning: Failed to cleanup questions with IDs %v. Error: %v", ids, err)
	}
}

// --- Test 1: Corrected and Complete Test ---
func TestCreateQuestionsInBatch_Success_InsertsAndReturnsIDs(t *testing.T) {
	s := setupStore(t)
	set := &questionsModels.Set{
		Visibility: "public",
		Title:      "Test Set 1",
		UserId:     "user_35NTPWlxQkDd1lBDt1gAYKa9trV",
	}
	setID, err := s.CreateSetWithContextRetSetId(set, "")
	if err != nil {
		slog.Error("failed to create set", "error", err)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == pgerrcode.ForeignKeyViolation {
				if pgErr.ConstraintName == "sets_user_id_fkey" {
					slog.Error("failed to create set",
						"error", "The User ID provided does not exist (FK Constraint)",
						"constraint", pgErr.ConstraintName,
					)
					t.Fatalf("Failed to create set due to foreign key violation: %v", err)
					return
				}
			}
		}
	}

	questions := []questionsModels.Question{
		{Difficulty: "easy", QuestionType: "multiple_choice_questions", Question: "What is 2+2?", SetId: setID},
		{Difficulty: "medium", QuestionType: "multiple_choice_questions", Question: "Capital of France?", SetId: setID},
	}
	expectedCount := len(questions)
	questionIds, err := s.CreateQuestionsInBatchReturnIds(questions)

	if err != nil {
		t.Fatalf("CreateQuestionsInBatch returned unexpected error: %v", err)
	}

	defer cleanupQuestions(t, s, questionIds)

	if len(questionIds) != expectedCount {
		t.Fatalf("Expected %d question IDs, but got %d", expectedCount, len(questionIds))
	}

	querySQL := "SELECT difficulty, set_id FROM questions WHERE id = $1"

	var actualDifficulty string
	var actualSetId string

	err = s.db.QueryRow(context.Background(), querySQL, questionIds[0]).
		Scan(&actualDifficulty, &actualSetId)

	if err != nil {
		t.Fatalf("Failed to retrieve inserted question 1: %v", err)
	}

	if actualDifficulty != questions[0].Difficulty || actualSetId != questions[0].SetId {
		t.Errorf("Inserted data mismatch. Got diff: %s, set: %s. Expected diff: %s, set: %s",
			actualDifficulty, actualSetId, questions[0].Difficulty, questions[0].SetId)
	}
}
