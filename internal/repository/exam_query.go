package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/model"
)

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
			user_id,
			set_id,
			title,
			visibility,
			COALESCE(description, '') AS description,
			start_time,
			(EXTRACT(EPOCH FROM duration)/60)::int AS duration,
			(start_time + duration) AS end_time,
			start_mode,
			session_status,
			invite_code,
			proctoring_enabled,
			camera_required,
			max_violations,
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
	rows, err := r.s.DB.Pool.Query(
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
			start_mode,
			session_status,
			invite_code,
			proctoring_enabled,
			camera_required,
			max_violations,
			created_at,
			updated_at
		 FROM exams
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 10`,
		user_id,
	)
	if err != nil {
		return nil, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Exam])
	if err != nil {
		return nil, err
	}

	if len(examsSlice) == 0 {
		return examsSlice, nil
	}

	setIds := make([]string, 0, len(examsSlice))
	for _, exam := range examsSlice {
		setIds = append(setIds, exam.SetId)
	}

	rows, err = r.s.DB.Pool.Query(
		context.Background(),
		`SELECT id, visibility, title, created_at, updated_at, user_id FROM sets WHERE id = ANY($1)`,
		setIds,
	)
	if err != nil {
		return nil, err
	}

	setsMap := make(map[string]model.Set)
	for rows.Next() {
		var s model.Set
		if err := rows.Scan(&s.ID, &s.Visibility, &s.Title, &s.CreatedAt, &s.UpdatedAt, &s.UserId); err != nil {
			return nil, err
		}
		setsMap[s.ID] = s
	}

	for i := range examsSlice {
		if s, ok := setsMap[examsSlice[i].SetId]; ok {
			examsSlice[i].Set = &s
		}
	}

	return examsSlice, nil
}

func (r *ExamRepository) GetExamsListBySetId(set_id string) ([]model.Exam, error) {
	rows, err := r.s.DB.Pool.Query(
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
			start_mode,
			session_status,
			invite_code,
			proctoring_enabled,
			camera_required,
			max_violations,
			created_at,
			updated_at
		 FROM exams
		 WHERE set_id = $1
		 ORDER BY created_at DESC
		 LIMIT 10`,
		set_id,
	)
	if err != nil {
		return nil, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Exam])
	if err != nil {
		return nil, err
	}

	return examsSlice, nil
}
