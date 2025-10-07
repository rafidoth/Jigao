package store

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/questions/models"
)

func (s Store) DeleteSetContext(set_id string) error {

	err := s.txDB(func(tx pgx.Tx) error {
		deleteContextSql := `
			DELETE FROM contexts
			WHERE set_id = $1`

		ct, err := tx.Exec(context.Background(), deleteContextSql, set_id)
		if err != nil {
			return err
		}

		if ct.RowsAffected() > 0 {
			slog.Info("Success: deleted context", "set id", set_id)
		} else {
			slog.Info("No context deleted (not found)", "set id", set_id)
		}
		return nil
	})
	return err
}

func (s Store) UpdateSetContext(set_id string, newContext string) (*models.SetContext, error) {
	var setContext models.SetContext

	err := s.txDB(func(tx pgx.Tx) error {
		updateContextSql := `
			UPDATE contexts
			SET context = $1
			WHERE set_id = $2
			RETURNING *`

		row, err := tx.Query(
			context.Background(),
			updateContextSql,
			newContext,
			set_id,
		)
		if err != nil {
			return err
		}

		setContext, err = pgx.CollectOneRow(row, pgx.RowToStructByName[models.SetContext])
		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}

		slog.Info("Success: updated context", "set id", set_id)
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &setContext, nil
}

func (s Store) GetSetContext(set_id string) (*models.SetContext, error) {
	var setContext models.SetContext

	err := s.txDB(func(tx pgx.Tx) error {
		getContextOfSet := `
			SELECT *
			FROM contexts 
			WHERE set_id = $1 
			`

		rows, err := tx.Query(context.Background(), getContextOfSet, set_id)
		if err != nil {
			return err
		}

		setContext, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[models.SetContext])
		if err != nil {
			return fmt.Errorf("failed to map rows to struct: %w", err)
		}

		slog.Info("Success: fetched context", "set id", set_id)
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &setContext, nil
}

func (s Store) SaveContext(set_context, set_id string) (*models.SetContext, error) {
	var setContext models.SetContext

	err := s.txDB(func(tx pgx.Tx) error {
		saveContextSql := `
			INSERT INTO contexts(context, set_id)
			VALUES ($1, $2)
			RETURNING *`

		row, err := tx.Query(
			context.Background(),
			saveContextSql,
			set_context,
			set_id,
		)

		setContext, err = pgx.CollectOneRow(row, pgx.RowToStructByName[models.SetContext])

		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}

		slog.Info("Created New Row in contexts Table in DB ", "Created", setContext)
		return err
	})

	if err != nil {
		return nil, err
	}
	return &setContext, err
}
