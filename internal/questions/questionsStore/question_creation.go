package questionsStore

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

func (s Store) CreateANewQuestionInASet(Q questionsModels.Question,
	choices []questionsModels.Choice, answer questionsModels.Answer, set_id string) error {

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())
	// inserting question and get its ID
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
		choice := make([]questionsModels.Choice, len(choices))
		for i, c := range choices {
			var insertedChoice questionsModels.Choice
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

func (s Store) CreateQuestionsInBatchReturnIds(questions []questionsModels.Question) ([]string, error) {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	insertQuestionSQL := `
		INSERT INTO questions (difficulty, question_type, question, set_id)  VALUES `

	var args []any

	for i, Q := range questions {
		offset := i * 4
		single_sql := fmt.Sprintf("($%d, $%d, $%d, $%d), ", offset+1, offset+2, offset+3, offset+4)
		insertQuestionSQL += single_sql
		args = append(args, Q.Difficulty, Q.QuestionType, Q.Question, Q.SetId)
	}
	// remove last comma and add RETURNING clause
	insertQuestionSQL = insertQuestionSQL[:len(insertQuestionSQL)-2] + " RETURNING id;"

	rows, err := tx.Query(context.Background(), insertQuestionSQL, args...)
	if err != nil {
		slog.Warn("failed to execute batch insert query of questions", "error", err)
		return nil, err
	}
	defer rows.Close()

	var questionIds []string

	for rows.Next() {
		var qID string
		if err := rows.Scan(&qID); err != nil {
			slog.Warn("failed to scan question ID", "error", err)
			return nil, err
		}
		questionIds = append(questionIds, qID)
	}

	if err := rows.Err(); err != nil {
		slog.Warn("error during rows iteration", "error", err)
		return nil, err
	}

	if len(questionIds) != len(questions) {
		return nil, fmt.Errorf("expected %d returned IDs, got %d", len(questions), len(questionIds))
	}

	if err := tx.Commit(context.Background()); err != nil {
		return nil, err
	}

	return questionIds, nil
}

func (s Store) SaveChoicesInBatch(choicesWithQuestionType []questionsModels.ChoicesWithQuestionType) (map[string][]questionsModels.Choice, error) {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	sql := `INSERT INTO choices ( choice, question_id)  VALUES `
	var args []any
	count := 0
	for _, cwqt := range choicesWithQuestionType {
		qType := cwqt.QuestionType
		qId := cwqt.QuestionId
		if qType == "multiple_choice_questions" || qType == "fill_in_the_blanks" || qType == "true_false" {
			for _, c := range cwqt.Choices {
				single_sql := fmt.Sprintf("($%d, $%d), ", count+1, count+2)
				sql += single_sql
				args = append(args, c.ChoiceText, qId)
				count += 2
			}
		} else if qType == "short_question" {
			// no choices to insert for short questions
			if len(cwqt.Choices) != 0 {
				slog.Warn("short question should not have choices, skipping insertion")
			}
			continue
		}
	}
	sql = sql[:len(sql)-2] + " RETURNING * ;"

	rows, err := tx.Query(context.Background(), sql, args...)
	if err != nil {
		slog.Warn("failed to execute batch insert query of choices", "error", err)
		return nil, err
	}
	defer rows.Close()
	choicesMapWithQuestionId := make(map[string][]questionsModels.Choice)
	for rows.Next() {
		var choice questionsModels.Choice
		if err := rows.Scan(
			&choice.Id,
			&choice.CreatedAt,
			&choice.ChoiceText,
			&choice.QuestionId,
		); err != nil {
			slog.Warn("failed to scan choice", "error", err)
			return nil, err
		}
		choicesMapWithQuestionId[choice.QuestionId] = append(choicesMapWithQuestionId[choice.QuestionId], choice)
	}
	if err := tx.Commit(context.Background()); err != nil {
		return nil, err
	}
	return choicesMapWithQuestionId, nil
}

func (s Store) SaveAnswersInBatch(answersWithQuestionInfo []questionsModels.AnswerWithQuestionInfo, choicesMap map[string][]questionsModels.Choice) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	insertAnswerSQL := `INSERT INTO answers (answer, explanation, question_id, choice_id) VALUES `
	var args []any
	count := 0

	for _, awqi := range answersWithQuestionInfo {
		qType := awqi.QuestionType
		qId := awqi.QuestionId

		// Short questions: no choice_id needed
		if qType == "short_question" {
			single_sql := fmt.Sprintf("($%d, $%d, $%d, NULL), ", count+1, count+2, count+3)
			insertAnswerSQL += single_sql
			args = append(args, awqi.AnswerText, awqi.Explanation, qId)
			count += 3
		} else if qType == "multiple_choice_questions" || qType == "true_false" {
			// Find the matching choice_id for the answer
			var choiceId *string
			if choices, exists := choicesMap[qId]; exists {
				for _, c := range choices {
					if c.ChoiceText == awqi.AnswerText {
						choiceId = &c.Id
						break
					}
				}
			}

			if choiceId == nil {
				slog.Warn("no matching choice found for answer",
					"question_id", qId,
					"answer_text", awqi.AnswerText,
				)
				// Insert with NULL choice_id rather than failing
				single_sql := fmt.Sprintf("($%d, $%d, $%d, NULL), ", count+1, count+2, count+3)
				insertAnswerSQL += single_sql
				args = append(args, awqi.AnswerText, awqi.Explanation, qId)
				count += 3
			} else {
				single_sql := fmt.Sprintf("($%d, $%d, $%d, $%d), ", count+1, count+2, count+3, count+4)
				insertAnswerSQL += single_sql
				args = append(args, awqi.AnswerText, awqi.Explanation, qId, *choiceId)
				count += 4
			}
		}
	}

	// Remove last comma and space
	insertAnswerSQL = insertAnswerSQL[:len(insertAnswerSQL)-2] + ";"

	_, err = tx.Exec(context.Background(), insertAnswerSQL, args...)
	if err != nil {
		slog.Warn("failed to execute batch insert query of answers", "error", err)
		return err
	}

	if err := tx.Commit(context.Background()); err != nil {
		return err
	}

	return nil
}
