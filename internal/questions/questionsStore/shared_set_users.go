package questionsStore

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/users"
)

func (s Store) AddSharedAccessUser(setId, userId string) error {
	err := s.txDB(func(tx pgx.Tx) error {
		addUserSql := `
			INSERT INTO shared_set_users (set_id, user_id)
			VALUES ($1, $2)
			ON CONFLICT (set_id, user_id) DO NOTHING`

		_, err := tx.Exec(context.Background(), addUserSql, setId, userId)
		if err != nil {
			return fmt.Errorf("add shared access user: %w", err)
		}
		slog.Info("Added shared access user", "set_id", setId, "email", userId)
		return nil
	})

	if err != nil {
		return fmt.Errorf("AddSharedAccessUser tx: %w", err)
	}
	return nil
}

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

func (s Store) GetSharedAccessUsersList(setId string) ([]users.User, error) {
	var userList []users.User

	err := s.txDB(func(tx pgx.Tx) error {
		getUsersSql := `
			SELECT u.id, u.email, u.name, u.image_url
			FROM shared_set_users s
			JOIN users u ON u.id = s.user_id
			WHERE s.set_id = $1`

		rows, err := tx.Query(context.Background(), getUsersSql, setId)
		if err != nil {
			return fmt.Errorf("query users: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var u users.User
			if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.ImageURL); err != nil {
				return fmt.Errorf("scan user: %w", err)
			}
			userList = append(userList, u)
		}

		if err := rows.Err(); err != nil {
			return fmt.Errorf("iterate rows: %w", err)
		}

		slog.Info("Retrieved shared access users", "set_id", setId, "count", len(userList))
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("GetSharedAccessUsersList tx: %w", err)
	}
	return userList, nil
}
