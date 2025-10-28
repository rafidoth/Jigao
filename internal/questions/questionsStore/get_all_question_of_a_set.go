package questionsStore

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

func (s Store) GetAllQuestionsInASet(
	setID string) ([]questionsModels.CompleteQuestion, error) {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return nil, err
	}

	defer tx.Rollback(context.Background())

	qRows, err := tx.Query(context.Background(), `
		SELECT *
		FROM questions
		WHERE set_id = $1
	`, setID)
	if err != nil {
		return nil, err
	}

	dbQuestions, err := pgx.CollectRows(qRows,
		pgx.RowToStructByName[questionsModels.Question])
	if err != nil {
		return nil, err
	}

	results := make([]questionsModels.CompleteQuestion, 0, len(dbQuestions))
	for _, q := range dbQuestions {
		cRows, err := tx.Query(context.Background(), `
			SELECT *
			FROM choices
			WHERE question_id = $1
		`, q.Id)
		if err != nil {
			return nil, err
		}

		choices, err := pgx.CollectRows(cRows,
			pgx.RowToStructByName[questionsModels.Choice])
		if err != nil {
			return nil, err
		}

		aRows, err := tx.Query(context.Background(), `
			SELECT *
			FROM answers
			WHERE question_id = $1
			LIMIT 1
		`, q.Id)
		if err != nil {
			return nil, err
		}

		var answer questionsModels.Answer
		answer, err = pgx.CollectOneRow(aRows,
			pgx.RowToStructByName[questionsModels.Answer])
		if err != nil && err != pgx.ErrNoRows {
			return nil, err
		}

		newCompleteQuestion := questionsModels.NewCompleteQuestion(q, choices, answer)
		results = append(results, newCompleteQuestion)
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return nil, err
	}

	return results, nil
}
