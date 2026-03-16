package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/server"
)

type QuestionRepository struct {
	s *server.Server
}

func NewQuestionRepository(s *server.Server) *QuestionRepository {
	return &QuestionRepository{s: s}
}

func (r *QuestionRepository) insertQuestion(tx pgx.Tx, Q model.Question, setID string) (string, error) {
	var questionID string
	err := tx.QueryRow(context.Background(),
		`INSERT INTO questions (difficulty, question_type, question, set_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id`,
		Q.Difficulty, Q.QuestionType, Q.Question, setID,
	).Scan(&questionID)
	if err != nil {
		r.s.Logger.Warn().Err(err).Msg("failed to insert question")
		return "", err
	}
	return questionID, nil
}

func (r *QuestionRepository) insertChoices(tx pgx.Tx, choices []model.Choice, questionID string) ([]model.Choice, error) {
	inserted := make([]model.Choice, 0, len(choices))
	for i, c := range choices {
		position := i + 1 // 1-indexed position
		var ic model.Choice
		err := tx.QueryRow(context.Background(),
			`INSERT INTO choices (choice, question_id, position)
			 VALUES ($1, $2, $3)
			 RETURNING id, created_at, choice, question_id, position`,
			c.ChoiceText, questionID, position,
		).Scan(&ic.Id, &ic.CreatedAt, &ic.ChoiceText, &ic.QuestionId, &ic.Position)
		if err != nil {
			r.s.Logger.Warn().Err(err).Msg("failed to insert choice")
			return nil, err
		}
		inserted = append(inserted, ic)
	}
	return inserted, nil
}

func (r *QuestionRepository) insertAnswer(tx pgx.Tx, correctAnswer model.CorrectAnswer, explanation string, questionID string) error {
	answerJSON, err := json.Marshal(correctAnswer)
	if err != nil {
		return fmt.Errorf("marshal correct answer: %w", err)
	}
	_, err = tx.Exec(context.Background(),
		`INSERT INTO answers (answer, explanation, question_id)
		 VALUES ($1, $2, $3)`,
		answerJSON, explanation, questionID,
	)
	if err != nil {
		r.s.Logger.Warn().Err(err).Msg("failed to insert answer")
		return err
	}
	return nil
}

func (r *QuestionRepository) CreateMultipleChoiceQuestion(Q model.Question, choices []model.Choice, answer model.Answer, set_id string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	questionID, err := r.insertQuestion(tx, Q, set_id)
	if err != nil {
		return err
	}

	insertedChoices, err := r.insertChoices(tx, choices, questionID)
	if err != nil {
		return err
	}

	// Find the choice ID that matches the correct answer position (1-indexed)
	correctPosition := answer.CorrectAnswer.MCQ_CorrectChoicePosition
	var correctChoiceID string
	for _, c := range insertedChoices {
		if c.Position == correctPosition {
			correctChoiceID = c.Id
			break
		}
	}

	if correctChoiceID == "" {
		r.s.Logger.Warn().Int("position", correctPosition).Msg("no choice found for correct position")
		return fmt.Errorf("invalid correct choice position: %d", correctPosition)
	}

	correctAnswer := model.CorrectAnswer{
		MCQ_CorrectChoicePosition: answer.CorrectAnswer.MCQ_CorrectChoicePosition,
	}

	if err := r.insertAnswer(tx, correctAnswer, answer.Explanation, questionID); err != nil {
		return err
	}

	return tx.Commit(context.Background())
}

func (r *QuestionRepository) CreateFillInTheBlanks(Q model.Question, answer model.Answer, set_id string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	questionID, err := r.insertQuestion(tx, Q, set_id)
	if err != nil {
		return err
	}

	correctAnswer := model.CorrectAnswer{
		FIB_AcceptedAnswers: answer.CorrectAnswer.FIB_AcceptedAnswers,
		FIB_CaseSensitive:   answer.CorrectAnswer.FIB_CaseSensitive,
	}

	if err := r.insertAnswer(tx, correctAnswer, answer.Explanation, questionID); err != nil {
		return err
	}

	return tx.Commit(context.Background())
}

func (r *QuestionRepository) CreateTrueFalse(Q model.Question, answer model.Answer, set_id string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	questionID, err := r.insertQuestion(tx, Q, set_id)
	if err != nil {
		return err
	}

	correctAnswer := model.CorrectAnswer{
		TF_CorrectChoice: answer.CorrectAnswer.TF_CorrectChoice,
	}

	if err := r.insertAnswer(tx, correctAnswer, answer.Explanation, questionID); err != nil {
		return err
	}

	return tx.Commit(context.Background())
}

func (r *QuestionRepository) CreateShortQuestion(Q model.Question, answer model.Answer, set_id string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	questionID, err := r.insertQuestion(tx, Q, set_id)
	if err != nil {
		return err
	}

	correctAnswer := model.CorrectAnswer{
		SQ_ModelAnswer: answer.CorrectAnswer.SQ_ModelAnswer,
	}

	if err := r.insertAnswer(tx, correctAnswer, answer.Explanation, questionID); err != nil {
		return err
	}

	return tx.Commit(context.Background())
}

func (r *QuestionRepository) GetQuestionsBySetID(setID string) ([]model.Question, error) {
	rows, err := r.s.DB.Pool.Query(context.Background(), `
		SELECT *
		FROM questions
		WHERE set_id = $1
	`, setID)
	if err != nil {
		return nil, err
	}

	questions, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Question])
	if err != nil {
		return nil, err
	}

	return questions, nil
}

func (r *QuestionRepository) GetChoicesForQuestions(questionIDs []string) (map[string][]model.Choice, error) {
	if len(questionIDs) == 0 {
		return make(map[string][]model.Choice), nil
	}

	rows, err := r.s.DB.Pool.Query(context.Background(), `
		SELECT *
		FROM choices
		WHERE question_id = ANY($1)
	`, questionIDs)
	if err != nil {
		return nil, err
	}

	choices, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Choice])
	if err != nil {
		return nil, err
	}

	choicesMap := make(map[string][]model.Choice)
	for _, c := range choices {
		choicesMap[c.QuestionId] = append(choicesMap[c.QuestionId], c)
	}

	return choicesMap, nil
}

func (r *QuestionRepository) GetAnswersForQuestions(questionIDs []string) (map[string]model.Answer, error) {
	if len(questionIDs) == 0 {
		return make(map[string]model.Answer), nil
	}

	rows, err := r.s.DB.Pool.Query(context.Background(), `
		SELECT id, created_at, answer, explanation, question_id
		FROM answers
		WHERE question_id = ANY($1)
	`, questionIDs)
	if err != nil {
		return nil, err
	}

	answers, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Answer])
	if err != nil {
		return nil, err
	}

	answersMap := make(map[string]model.Answer)
	for _, a := range answers {
		answersMap[a.QuestionId] = a
	}

	return answersMap, nil
}
