package examsStore

import "context"

func (s Store) GetExamSetId(exam_id string) (string, error) {
	tx, err := s.db.Begin(context.Background())
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
