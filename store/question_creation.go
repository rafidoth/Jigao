package store

import (
	"context"

	"github.com/rafidoth/onlyexams/models"
)

func (s Store) CreateANewQuestionInASet(Q models.Question,
	choices []models.Choice, answer models.Answer, set_id string) error {

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}

	defer tx.Rollback(context.Background())

	// Insert question and get its ID
	var questionID string
	insertQuestionSQL := `
		INSERT INTO questions (difficulty, question_type, question, position, set_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	err = tx.QueryRow(context.Background(), insertQuestionSQL,
		Q.Difficulty,
		Q.QuestionType,
		Q.Question,
		Q.Position,
		set_id,
	).Scan(&questionID)
	if err != nil {
		return err
	}

	// Insert choices for the question
	insertChoiceSQL := `
		INSERT INTO choices (position, choice, question_id)
		VALUES ($1, $2, $3)
		RETURNING *
		`

	choice := make([]models.Choice, len(choices))
	for i, c := range choices {
		var insertedChoice models.Choice
		// Derive position from order since model lacks it
		pos := int16(i + 1)
		err := tx.QueryRow(context.Background(), insertChoiceSQL,
			pos,
			c.ChoiceText,
			questionID,
		).Scan(
			&insertedChoice.Id,
			&insertedChoice.CreatedAt,
			&insertedChoice.Position,
			&insertedChoice.ChoiceText,
			&insertedChoice.QuestionId,
		)
		choice[i] = insertedChoice
		if err != nil {
			return err
		}
	}

	var choiceId string
	for _, c := range choice {
		if c.ChoiceText == answer.AnswerText {
			choiceId = c.Id
			break
		}
	}

	// Insert answer for the question
	insertAnswerSQL := `
		INSERT INTO answers (answer, explanation, question_id, choice_id)
		VALUES ($1, $2, $3, $4)`
	_, err = tx.Exec(context.Background(), insertAnswerSQL,
		answer.AnswerText,
		answer.Explanation,
		questionID,
		choiceId,
	)
	if err != nil {
		return err
	}

	// Commit transaction
	err = tx.Commit(context.Background())
	if err != nil {
		return err
	}

	return nil
}
