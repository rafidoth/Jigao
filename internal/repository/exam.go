package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/server"
)

type ExamRepository struct {
	s *server.Server
}

func NewExamRepository(s *server.Server) *ExamRepository {
	return &ExamRepository{s: s}
}

func (r *ExamRepository) IsExamExists(set_id string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	var exists bool
	err = tx.QueryRow(
		context.Background(),
		"SELECT EXISTS(SELECT 1 FROM exams WHERE id = $1)",
		set_id,
	).Scan(&exists)

	if err != nil {
		return err
	}

	if !exists {
		return fmt.Errorf("exam not found")
	}

	if err := tx.Commit(context.Background()); err != nil {
		return err
	}

	return nil
}

func (r *ExamRepository) CreateExamOnASet(create *model.ExamCreate) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}

	defer tx.Rollback(context.Background())

	_, err = tx.Exec(
		context.Background(),
		`INSERT INTO exams (
			user_id,
			set_id,
			title,
			description,
			start_time,
			duration,
			start_mode,
			proctoring_enabled,
			camera_required
		)
		VALUES ($1, $2, $3, $4, $5, make_interval(mins := $6), $7, $8, $9)`,
		create.UserID,
		create.SetID,
		create.Title,
		create.Description,
		create.StartTime,
		create.DurationInMinutes,
		create.StartMode,
		create.ProctoringEnabled,
		create.CameraRequired,
	)
	if err != nil {
		return err
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return err
	}

	return nil
}

func (r *ExamRepository) UpdateExam(update *model.ExamUpdate) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	setClauses := make([]string, 0, 8)
	args := make([]any, 0, 10)
	argPos := 1

	if update.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argPos))
		args = append(args, *update.Title)
		argPos++
	}
	if update.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argPos))
		args = append(args, *update.Description)
		argPos++
	}
	if update.StartTime != nil {
		setClauses = append(setClauses, fmt.Sprintf("start_time = $%d", argPos))
		args = append(args, *update.StartTime)
		argPos++
	}
	if update.DurationInMinutes != nil {
		setClauses = append(setClauses, fmt.Sprintf("duration = make_interval(mins := $%d)", argPos))
		args = append(args, *update.DurationInMinutes)
		argPos++
	}
	if update.StartMode != nil {
		setClauses = append(setClauses, fmt.Sprintf("start_mode = $%d", argPos))
		args = append(args, *update.StartMode)
		argPos++
	}
	if update.SessionStatus != nil {
		setClauses = append(setClauses, fmt.Sprintf("session_status = $%d", argPos))
		args = append(args, *update.SessionStatus)
		argPos++
	}
	if update.ProctoringEnabled != nil {
		setClauses = append(setClauses, fmt.Sprintf("proctoring_enabled = $%d", argPos))
		args = append(args, *update.ProctoringEnabled)
		argPos++
	}
	if update.CameraRequired != nil {
		setClauses = append(setClauses, fmt.Sprintf("camera_required = $%d", argPos))
		args = append(args, *update.CameraRequired)
		argPos++
	}
	if update.MaxViolations != nil {
		setClauses = append(setClauses, fmt.Sprintf("max_violations = $%d", argPos))
		args = append(args, *update.MaxViolations)
		argPos++
	}

	if len(setClauses) == 0 {
		return fmt.Errorf("no fields to update")
	}

	query := fmt.Sprintf(
		"UPDATE exams SET %s WHERE id = $%d AND user_id = $%d",
		strings.Join(setClauses, ", "),
		argPos,
		argPos+1,
	)
	args = append(args, update.ID, update.UserID)

	ct, err := tx.Exec(context.Background(), query, args...)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("exam not found")
	}

	if err := tx.Commit(context.Background()); err != nil {
		return err
	}
	return nil
}

func (r *ExamRepository) RemoveExam(userID, examID string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	ct, err := tx.Exec(
		context.Background(),
		"DELETE FROM exams WHERE id = $1 AND user_id = $2",
		examID,
		userID,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("exam not found")
	}
	if err := tx.Commit(context.Background()); err != nil {
		return err
	}
	return nil
}

func (r *ExamRepository) GetExamsBySetId(set_id string) ([]model.Exam, error) {
	var results []model.Exam

	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	rows, err := tx.Query(
		context.Background(),
		`SELECT
			id,
			user_id,
			set_id,
			title,
			visibility,
			COALESCE(description, '') AS description,
			start_time,
			(EXTRACT(EPOCH FROM duration)/60)::int AS duration,
			(start_time + duration) AS end_time,
			created_at,
			updated_at
		 FROM exams
		 WHERE set_id = $1`,
		set_id,
	)
	if err != nil {
		return nil, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Exam])
	if err != nil {
		return nil, err
	}
	results = examsSlice

	if err := tx.Commit(context.Background()); err != nil {
		return nil, err
	}

	return results, nil
}

func (r *ExamRepository) GetExamSetId(exam_id string) (string, error) {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return "", err
	}
	defer tx.Rollback(context.Background())

	var setId string
	err = tx.QueryRow(
		context.Background(),
		"SELECT set_id FROM exams WHERE id = $1",
		exam_id,
	).Scan(&setId)
	if err != nil {
		return "", err
	}

	if err := tx.Commit(context.Background()); err != nil {
		return "", err
	}

	return setId, nil
}

func (r *ExamRepository) GetExamByExamId(exam_id string) (model.Exam, error) {
	fmt.Println("Getting exam by exam id:", exam_id)
	var exam model.Exam

	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return exam, err
	}
	defer tx.Rollback(context.Background())

	rows, err := tx.Query(
		context.Background(),
		`SELECT
			id,
			set_id,
			user_id,
			visibility,
			description,
			title,
			start_time,
			(EXTRACT(EPOCH FROM duration)/60)::int AS duration,
			(start_time + duration) AS end_time,
			created_at,
			updated_at
		 FROM exams
		 WHERE id = $1`,
		exam_id,
	)
	if err != nil {
		return exam, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Exam])
	if err != nil {
		return exam, err
	}
	if len(examsSlice) == 0 {
		return exam, fmt.Errorf("exam not found")
	}
	exam = examsSlice[0]

	if err := tx.Commit(context.Background()); err != nil {
		return exam, err
	}

	return exam, nil
}

func (r *ExamRepository) GetExamsListByUserId(user_id string) ([]model.Exam, error) {

	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())
	rows, err := tx.Query(
		context.Background(),
		`SELECT
			id,
			user_id,
			set_id,
			title,
			visibility,
			COALESCE(description, '') AS description,
			start_time,
			(EXTRACT(EPOCH FROM duration)/60)::int AS duration,
			(start_time + duration) AS end_time,
			created_at,
			updated_at
		 FROM exams
		 WHERE user_id= $1`,
		user_id,
	)
	if err != nil {
		return nil, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Exam])
	if err != nil {
		return nil, err
	}
	set_ids := make([]string, 0, len(examsSlice))
	for _, exam := range examsSlice {
		set_ids = append(set_ids, exam.SetId)
	}

	rows, err = tx.Query(
		context.Background(),
		`  SELECT
			id,
			user_id,
			title,
			created_at,
			updated_at
		  FROM sets
		  WHERE id = ANY($1)`,
		set_ids,
	)
	if err != nil {
		return nil, err
	}

	setsMap := make(map[string]model.Set)
	for rows.Next() {
		var set model.Set
		if err := rows.Scan(
			&set.ID,
			&set.UserId,
			&set.Title,
			&set.CreatedAt,
			&set.UpdatedAt,
		); err != nil {
			return nil, err
		}
		setsMap[set.ID] = set
	}
	fmt.Println("setsMap:", setsMap)

	for i := range examsSlice {
		if set, ok := setsMap[examsSlice[i].SetId]; ok {
			examsSlice[i].Set = &set
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		return nil, err
	}

	return examsSlice, nil
}

// --- Submission & Evaluation ---

// EvaluateSubmittedExam receives a synthetic submissionId in the form "examID:userID"
// and triggers evaluation by splitting and delegating to EvaluateSubmission.
func (r *ExamRepository) EvaluateSubmittedExam(submissionId string) error {
	parts := strings.SplitN(submissionId, ":", 2)
	if len(parts) != 2 {
		return nil
	}
	return r.EvaluateSubmission(parts[0], parts[1])
}

func (r *ExamRepository) GetEvaluationResult(examID, userID string) (*model.EvaluationResult, error) {
	ctx := context.Background()
	var evaluatedResult model.EvaluationResult
	var answerJson []byte

	if err := r.s.DB.Pool.QueryRow(ctx, `
		SELECT score, answers, created_at
		FROM exam_submissions
		WHERE exam_id = $1 AND user_id = $2
		ORDER BY created_at DESC
		LIMIT 1
	`, examID, userID).Scan(&evaluatedResult.Score, &answerJson, &evaluatedResult.CreatedAt); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(answerJson, &evaluatedResult.AnswerSheet); err != nil {
		return nil, err
	}

	return &evaluatedResult, nil
}

type UserSubmissionAnswer struct {
	UserAnswer    string `json:"answer"`
	IsCorrect     bool   `json:"is_correct"`
	CorrectAnswer string `json:"correct_answer"`
}

func (r *ExamRepository) SaveSubmittedExamAnswers(examId, userId string, answers map[string]string) error {
	ctx := context.Background()

	payload, err := json.Marshal(answers)
	if err != nil {
		return err
	}

	tx, err := r.s.DB.Pool.Begin(ctx)
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

func (r *ExamRepository) EvaluateSubmission(examID, userID string) error {
	ctx := context.Background()
	tx, err := r.s.DB.Pool.Begin(ctx)
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
