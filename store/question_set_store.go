package store

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/models"
)

func (s Store) GetRecentSets(limit int, user_id string) ([]*models.Set, error) {
	var recentSets []*models.Set

	err := s.txDB(func(tx pgx.Tx) error {
		getRecentSetsSql := `
			SELECT *
			FROM sets
			WHERE user_id = $1 
			ORDER BY updated_at DESC
			LIMIT $2`

		rows, err := tx.Query(context.Background(), getRecentSetsSql, user_id, limit)
		if err != nil {
			return err
		}

		sets, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Set])
		if err != nil {
			return fmt.Errorf("failed to map rows to struct: %w", err)
		}

		for i := range sets {
			recentSets = append(recentSets, &sets[i])
		}

		slog.Info("Success: fetched recent public sets", "count", len(recentSets))
		return nil
	})

	if err != nil {
		return nil, err
	}
	return recentSets, nil
}

func (s Store) CreateNewSet(qSet *models.Set) (*models.Set, error) {
	var set models.Set
	err := s.txDB(func(tx pgx.Tx) error {
		createNewSet := `
			INSERT INTO sets (visibility, title, user_id)
			VALUES ($1, $2, $3)
			RETURNING *`

		row, err := tx.Query(
			context.Background(),
			createNewSet,
			qSet.Visibility,
			qSet.Title,
			qSet.UserId,
		)

		set, err = pgx.CollectOneRow(row, pgx.RowToStructByName[models.Set])

		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}
		slog.Info("Created New Row in sets Table in DB ", "Created", set)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &set, err
}

func (s Store) GetASet(qSet *models.Set) (*models.Set, error) {
	var set models.Set
	err := s.txDB(func(tx pgx.Tx) error {
		getASet := `SELECT * FROM sets WHERE id = $1 AND user_id = $2`

		row, err := tx.Query(
			context.Background(),
			getASet,
			qSet.ID,
			qSet.UserId,
		)

		set, err = pgx.CollectOneRow(row, pgx.RowToStructByName[models.Set])

		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}
		slog.Info("Success :  fetched a set from sets Table in DB ", "Fetched", set)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &set, err
}

func (s Store) UpdateASet(qSet *models.Set) (*models.Set, error) {
	var set models.Set
	err := s.txDB(func(tx pgx.Tx) error {
		updateSet := `UPDATE sets SET visibility = $1, title = $2 WHERE id = $3 AND user_id = $4 RETURNING *`

		row, err := tx.Query(
			context.Background(),
			updateSet,
			qSet.Visibility,
			qSet.Title,
			qSet.ID,
			qSet.UserId,
		)

		set, err = pgx.CollectOneRow(row, pgx.RowToStructByName[models.Set])
		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}
		slog.Info("Success : updated a set in sets Table in DB", "Updated", set)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &set, err
}

func (s Store) DeleteASet(qSet *models.Set) (*models.Set, error) {
	var set models.Set
	err := s.txDB(func(tx pgx.Tx) error {
		deleteSet := `DELETE FROM sets WHERE id = $1 AND user_id = $2 RETURNING *`

		row, err := tx.Query(
			context.Background(),
			deleteSet,
			qSet.ID,
			qSet.UserId,
		)

		set, err = pgx.CollectOneRow(row, pgx.RowToStructByName[models.Set])
		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}
		slog.Info("Success : deleted a set from sets Table in DB", "Deleted", set)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &set, err
}
