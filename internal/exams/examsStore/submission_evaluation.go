package examsStore

import (
	"context"
	"encoding/json"

	"github.com/rafidoth/onlyexams/internal/exams/models"
)

func (s Store) GetEvaluationResult(examID, userID string) (int, map[string]models.EvaluatedAnswerType, error) {
	ctx := context.Background()
	var scoreInt int
	var answersJSON []byte

	if err := s.db.QueryRow(ctx, `
		SELECT score, answers
		FROM exam_submissions
		WHERE exam_id = $1 AND user_id = $2
		ORDER BY created_at DESC
		LIMIT 1
	`, examID, userID).Scan(&scoreInt, &answersJSON); err != nil {
		return 0, nil, err
	}

	var evaluated map[string]models.EvaluatedAnswerType
	if err := json.Unmarshal(answersJSON, &evaluated); err != nil {
		return 0, nil, err
	}

	return scoreInt, evaluated, nil
}

type UserSubmissionAnswer struct {
	UserAnswer    string `json:"answer"`
	IsCorrect     bool   `json:"is_correct"`
	CorrectAnswer string `json:"correct_answer"`
}

func (s Store) SaveSubmittedExamAnswers(examId, userId string, answers map[string]string) error {
	ctx := context.Background()

	payload, err := json.Marshal(answers)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO exam_submissions (exam_id, user_id, answers)
		VALUES ($1, $2, $3)
	`, examId, userId, payload)

	if err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return nil
}

func (s Store) EvaluateSubmission(examID, userID string) error {
	ctx := context.Background()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}

	defer tx.Rollback(ctx)

	var setID string
	if err := tx.QueryRow(ctx, `SELECT set_id FROM exams WHERE id = $1`, examID).Scan(&setID); err != nil {
		return err
	}

	rows, err := tx.Query(ctx, `
		SELECT q.id AS question_id, a.answer AS correct_answer
		FROM questions q
		JOIN answers a ON a.question_id = q.id
		WHERE q.set_id = $1
		  AND q.question_type != 'short_question'
	`, setID)

	if err != nil {
		return err
	}
	defer rows.Close()

	correctMap := make(map[string]string)
	for rows.Next() {
		var qid, ans string
		if err := rows.Scan(&qid, &ans); err != nil {
			return err
		}
		correctMap[qid] = ans
	}
	if rows.Err() != nil {
		return rows.Err()
	}

	var answersJSON []byte
	err = tx.QueryRow(ctx, `
		SELECT answers
		FROM exam_submissions
		WHERE exam_id = $1 AND user_id = $2
		ORDER BY created_at DESC
		LIMIT 1
	`, examID, userID).Scan(&answersJSON)
	if err != nil {
		return err
	}

	submittedMap := make(map[string]string)
	if err := json.Unmarshal(answersJSON, &submittedMap); err != nil {
		return err
	}

	answersJson := make(map[string]UserSubmissionAnswer)
	score := 0
	for qid, correct := range correctMap {
		if submitted, ok := submittedMap[qid]; ok {
			if submitted == correct {
				score++
			}
			answersJson[qid] = UserSubmissionAnswer{
				UserAnswer:    submitted,
				IsCorrect:     submitted == correct,
				CorrectAnswer: correct,
			}
		}
	}

	b, err := json.Marshal(answersJson)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
	UPDATE exam_submissions
	SET score = $3,
	    answers = $4
	WHERE exam_id = $1
	  AND user_id = $2
`, examID, userID, score, b)

	if err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return nil
}
