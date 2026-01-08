package examsStore

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/exams/models"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

func (s Store) GetExamsListByUserId(user_id string) ([]models.Exam, error) {

	tx, err := s.db.Begin(context.Background())
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

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Exam])
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

	setsMap := make(map[string]questionsModels.Set)
	for rows.Next() {
		var set questionsModels.Set
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
