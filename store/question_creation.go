package store

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/rafidoth/onlyexams/models"
)

func (s Store) CreateANewQuestionInASet(Q models.Question,
	choices []models.Choice, answer models.Answer, set_id string) error {

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}

	fmt.Println(Q)
	fmt.Println(answer)
	fmt.Println(choices)
	fmt.Println(set_id)

	defer tx.Rollback(context.Background())

	// Insert question and get its ID
	var questionID string
	insertQuestionSQL := `
		INSERT INTO questions (difficulty, question_type, question, set_id)
		VALUES ($1, $2, $3, $4 )
		RETURNING id`

	err = tx.QueryRow(context.Background(), insertQuestionSQL,
		Q.Difficulty,
		Q.QuestionType,
		Q.Question,
		set_id,
	).Scan(&questionID)
	if err != nil {
		slog.Warn("failed to insert question", "error", err)
		return err
	}

	insertChoiceSQL := `
		INSERT INTO choices ( choice, question_id)
		VALUES ($1, $2)
		RETURNING *
		`
	// choices len zero means it's a descriptive question (short question)
	if len(choices) != 0 {
		choice := make([]models.Choice, len(choices))
		for i, c := range choices {
			var insertedChoice models.Choice
			err := tx.QueryRow(context.Background(), insertChoiceSQL,
				c.ChoiceText,
				questionID,
			).Scan(
				&insertedChoice.Id,
				&insertedChoice.CreatedAt,
				&insertedChoice.ChoiceText,
				&insertedChoice.QuestionId,
			)
			choice[i] = insertedChoice
			if err != nil {
				slog.Warn("failed to insert choice", "error", err)
				return err
			}
		}

		// for fill in the blanks
		// all the choices are correct answers
		if Q.QuestionType != "fill_in_the_blanks" {
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
		}

		if err != nil {
			slog.Warn("failed to insert answer", "error", err)
			return err
		}
	}

	// Commit transaction
	err = tx.Commit(context.Background())
	if err != nil {
		return err
	}

	return nil
}
