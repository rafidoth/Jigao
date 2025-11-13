package questionsStore

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

func (s Store) GetOwnerUserId(id string) (string, error) {
	var ownerUserId string

	err := s.txDB(func(tx pgx.Tx) error {
		getOwnerUserIdSql := `
			SELECT user_id
			FROM sets
			WHERE id = $1`

		row := tx.QueryRow(context.Background(), getOwnerUserIdSql, id)

		err := row.Scan(&ownerUserId)
		if err != nil {
			return fmt.Errorf("query owner user id: %w", err)
		}

		slog.Info("Success: fetched owner user id", "id", id, "ownerUserId", ownerUserId)
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("GetOwnerUserId tx: %w", err)
	}
	return ownerUserId, nil
}

func (s Store) GetVisibility(id string) (string, error) {
	var visibility string

	err := s.txDB(func(tx pgx.Tx) error {
		getVisibilitySql := `
			SELECT visibility
			FROM sets
			WHERE id = $1`

		row := tx.QueryRow(context.Background(), getVisibilitySql, id)

		err := row.Scan(&visibility)
		if err != nil {
			return fmt.Errorf("query visibility: %w", err)
		}

		slog.Info("Success: fetched visibility", "id", id, "visibility", visibility)
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("GetVisibility tx: %w", err)
	}
	return visibility, nil
}

func (s Store) GetRecentSets(limit int, user_id string) ([]*questionsModels.Set, error) {
	var recentSets []*questionsModels.Set

	err := s.txDB(func(tx pgx.Tx) error {
		getRecentSetsSql := `
			SELECT *
			FROM sets
			WHERE user_id = $1
			ORDER BY updated_at DESC
			LIMIT $2`

		rows, err := tx.Query(context.Background(), getRecentSetsSql, user_id, limit)
		if err != nil {
			return fmt.Errorf("query recent sets: %w", err)
		}

		sets, err := pgx.CollectRows(rows, pgx.RowToStructByName[questionsModels.Set])
		if err != nil {
			return fmt.Errorf("collect recent sets: %w", err)
		}

		for i := range sets {
			recentSets = append(recentSets, &sets[i])
		}

		slog.Info("Success: fetched recent sets", "count", len(recentSets))
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("GetRecentSets tx: %w", err)
	}
	return recentSets, nil
}

func (s Store) CreateNewSet(qSet *questionsModels.Set) (*questionsModels.Set, error) {
	var set questionsModels.Set
	err := s.txDB(func(tx pgx.Tx) error {
		createNewSet := `
			INSERT INTO sets (visibility, title, user_id)
			VALUES ($1, $2, $3)
			RETURNING *`

		rows, err := tx.Query(
			context.Background(),
			createNewSet,
			qSet.Visibility,
			qSet.Title,
			qSet.UserId,
		)
		if err != nil {
			return fmt.Errorf("insert set: %w", err)
		}

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[questionsModels.Set])
		if err != nil {
			return fmt.Errorf("collect inserted set: %w", err)
		}

		slog.Info("Created set", "id", set.ID, "title", set.Title)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("CreateNewSet tx: %w", err)
	}
	return &set, nil
}

func (s Store) GetASet(qSet *questionsModels.Set) (*questionsModels.Set, error) {
	var set questionsModels.Set
	err := s.txDB(func(tx pgx.Tx) error {
		getASet := `SELECT * FROM sets WHERE id = $1 AND user_id = $2`

		rows, err := tx.Query(
			context.Background(),
			getASet,
			qSet.ID,
			qSet.UserId,
		)
		if err != nil {
			return fmt.Errorf("select set: %w", err)
		}

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[questionsModels.Set])
		if err != nil {
			return fmt.Errorf("collect set: %w", err)
		}

		slog.Info("Fetched set", "id", set.ID)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("GetASet tx: %w", err)
	}
	return &set, nil
}

func (s Store) UpdateASet(qSet *questionsModels.Set) (*questionsModels.Set, error) {
	var set questionsModels.Set
	err := s.txDB(func(tx pgx.Tx) error {
		updateSet := `UPDATE sets SET visibility = $1, title = $2 WHERE id = $3 AND user_id = $4 RETURNING *`

		rows, err := tx.Query(
			context.Background(),
			updateSet,
			qSet.Visibility,
			qSet.Title,
			qSet.ID,
			qSet.UserId,
		)
		if err != nil {
			return fmt.Errorf("update set: %w", err)
		}

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[questionsModels.Set])
		if err != nil {
			return fmt.Errorf("collect updated set: %w", err)
		}

		slog.Info("Updated set", "id", set.ID)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("UpdateASet tx: %w", err)
	}
	return &set, nil
}

func (s Store) DeleteASet(qSet *questionsModels.Set) (*questionsModels.Set, error) {
	var set questionsModels.Set
	err := s.txDB(func(tx pgx.Tx) error {
		deleteSet := `DELETE FROM sets WHERE id = $1 AND user_id = $2 RETURNING *`

		rows, err := tx.Query(
			context.Background(),
			deleteSet,
			qSet.ID,
			qSet.UserId,
		)
		if err != nil {
			return fmt.Errorf("delete set: %w", err)
		}

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[questionsModels.Set])
		if err != nil {
			return fmt.Errorf("collect deleted set: %w", err)
		}

		slog.Info("Deleted set", "id", set.ID)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("DeleteASet tx: %w", err)
	}
	return &set, nil
}
