package store

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/models"
)

func (s Store) GetAllQuestionsInASet(
	setID string) ([]models.CompleteQuestion, error) {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return nil, err
	}

	defer tx.Rollback(context.Background())

	qRows, err := tx.Query(context.Background(), `
		SELECT *
		FROM questions
		WHERE set_id = $1
		ORDER BY position ASC
	`, setID)
	if err != nil {
		return nil, err
	}

	dbQuestions, err := pgx.CollectRows(qRows,
		pgx.RowToStructByName[models.Question])
	if err != nil {
		return nil, err
	}

	results := make([]models.CompleteQuestion, 0, len(dbQuestions))
	for _, q := range dbQuestions {
		cRows, err := tx.Query(context.Background(), `
			SELECT *
			FROM choices
			WHERE question_id = $1
			ORDER BY position ASC
		`, q.Id)
		if err != nil {
			return nil, err
		}

		choices, err := pgx.CollectRows(cRows,
			pgx.RowToStructByName[models.Choice])
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

		var answer models.Answer
		answer, err = pgx.CollectOneRow(aRows,
			pgx.RowToStructByName[models.Answer])
		if err != nil && err != pgx.ErrNoRows {
			return nil, err
		}

		newCompleteQuestion := models.NewCompleteQuestion(q, choices, answer)
		results = append(results, newCompleteQuestion)
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return nil, err
	}

	return results, nil
}
