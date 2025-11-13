package questionsStore

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
)

func (s Store) CheckUserAccess(userId, setId string) (bool, error) {
	var hasAccess bool

	err := s.txDB(func(tx pgx.Tx) error {
		checkAccessSql := `
			SELECT EXISTS (
				SELECT 1
				FROM shared_set_users
				WHERE set_id = $1 AND user_id = $2
			)`

		row := tx.QueryRow(context.Background(), checkAccessSql, setId, userId)
		if err := row.Scan(&hasAccess); err != nil {
			return fmt.Errorf("scan access exists: %w", err)
		}

		slog.Info("Checked shared access", "set_id", setId, "user_id", userId, "hasAccess", hasAccess)
		return nil
	})

	if err != nil {
		return false, fmt.Errorf("CheckUserAccess tx: %w", err)
	}
	return hasAccess, nil
}
