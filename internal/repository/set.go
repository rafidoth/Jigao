package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/server"
	"github.com/rafidoth/onlyexams/internal/users"
)

type SetRepository struct {
	s *server.Server
}

func NewSetRepository(s *server.Server) *SetRepository {
	return &SetRepository{s: s}
}

func (r *SetRepository) txDB(fn func(tx pgx.Tx) error) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return err
	}

	defer tx.Rollback(context.Background())

	err = fn(tx)
	if err != nil {
		return err
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return err
	}

	return nil
}

// --- Set CRUD ---

func (r *SetRepository) GetOwnerUserId(id string) (string, error) {
	var ownerUserId string

	err := r.txDB(func(tx pgx.Tx) error {
		getOwnerUserIdSql := `
			SELECT user_id
			FROM sets
			WHERE id = $1`

		row := tx.QueryRow(context.Background(), getOwnerUserIdSql, id)

		err := row.Scan(&ownerUserId)
		if err != nil {
			return fmt.Errorf("query owner user id: %w", err)
		}

		r.s.Logger.Info().Str("id", id).Str("ownerUserId", ownerUserId).Msg("Success: fetched owner user id")
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("GetOwnerUserId tx: %w", err)
	}
	return ownerUserId, nil
}

func (r *SetRepository) GetVisibility(id string) (string, error) {
	var visibility string

	err := r.txDB(func(tx pgx.Tx) error {
		getVisibilitySql := `
			SELECT visibility
			FROM sets
			WHERE id = $1`

		row := tx.QueryRow(context.Background(), getVisibilitySql, id)

		err := row.Scan(&visibility)
		if err != nil {
			return fmt.Errorf("query visibility: %w", err)
		}

		r.s.Logger.Info().Str("id", id).Str("visibility", visibility).Msg("Success: fetched visibility")
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("GetVisibility tx: %w", err)
	}
	return visibility, nil
}

func (r *SetRepository) GetRecentSets(limit int, user_id string) ([]*model.Set, error) {
	var recentSets []*model.Set

	err := r.txDB(func(tx pgx.Tx) error {
		getRecentSetsSql := `
            SELECT *
            FROM sets
            WHERE user_id = $1 -- 1. Sets created by the user

            UNION -- Combine the results

            SELECT s.*
            FROM sets s
            JOIN shared_set_users ssu ON s.id = ssu.set_id
            WHERE ssu.user_id = $1 -- 2. Sets shared with the user

            ORDER BY updated_at DESC
            LIMIT $2;`

		rows, err := tx.Query(context.Background(), getRecentSetsSql, user_id, limit)
		if err != nil {
			return fmt.Errorf("query recent sets: %w", err)
		}

		sets, err := pgx.CollectRows(rows, pgx.RowToStructByName[model.Set])
		if err != nil {
			return fmt.Errorf("collect recent sets: %w", err)
		}

		for i := range sets {
			recentSets = append(recentSets, &sets[i])
		}

		r.s.Logger.Info().Int("count", len(recentSets)).Msg("Success: fetched recent sets")
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("GetRecentSets tx: %w", err)
	}
	return recentSets, nil
}

func (r *SetRepository) CreateNewSet(qSet *model.Set) (*model.Set, error) {
	var set model.Set
	err := r.txDB(func(tx pgx.Tx) error {
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

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[model.Set])
		if err != nil {
			return fmt.Errorf("collect inserted set: %w", err)
		}

		r.s.Logger.Info().Str("id", set.ID).Str("title", set.Title).Msg("Created set")
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("CreateNewSet tx: %w", err)
	}
	return &set, nil
}

func (r *SetRepository) GetASet(qSet *model.Set) (*model.Set, error) {
	var set model.Set
	err := r.txDB(func(tx pgx.Tx) error {
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

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[model.Set])
		if err != nil {
			return fmt.Errorf("collect set: %w", err)
		}

		r.s.Logger.Info().Str("id", set.ID).Msg("Fetched set")
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("GetASet tx: %w", err)
	}
	return &set, nil
}

func (r *SetRepository) UpdateASet(qSet *model.Set) (*model.Set, error) {
	var set model.Set
	err := r.txDB(func(tx pgx.Tx) error {
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

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[model.Set])
		if err != nil {
			return fmt.Errorf("collect updated set: %w", err)
		}

		r.s.Logger.Info().Str("id", set.ID).Msg("Updated set")
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("UpdateASet tx: %w", err)
	}
	return &set, nil
}

func (r *SetRepository) DeleteASet(qSet *model.Set) (*model.Set, error) {
	var set model.Set
	err := r.txDB(func(tx pgx.Tx) error {
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

		set, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[model.Set])
		if err != nil {
			return fmt.Errorf("collect deleted set: %w", err)
		}

		r.s.Logger.Info().Str("id", set.ID).Msg("Deleted set")
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("DeleteASet tx: %w", err)
	}
	return &set, nil
}

// --- Set + Context creation ---

func (r *SetRepository) CreateSetWithContext(qSet *model.Set, qSetContext string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(context.Background())

	insertSetSQL := `
		INSERT INTO sets (visibility, title, user_id)
		VALUES ($1, $2, $3)
		RETURNING id`
	var setID string
	if err := tx.QueryRow(
		context.Background(),
		insertSetSQL,
		qSet.Visibility,
		qSet.Title,
		qSet.UserId,
	).Scan(&setID); err != nil {
		return fmt.Errorf("insert set: %w", err)
	}

	insertCtxSQL := `
		INSERT INTO contexts(context, set_id)
		VALUES ($1, $2)`
	if _, err := tx.Exec(
		context.Background(),
		insertCtxSQL,
		qSetContext,
		setID,
	); err != nil {
		return fmt.Errorf("insert context: %w", err)
	}

	if err := tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

func (r *SetRepository) CreateSetWithContextRetSetId(qSet *model.Set, qSetContext string) (string, error) {
	tx, err := r.s.DB.Pool.Begin(context.Background())
	if err != nil {
		return "", fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(context.Background())

	insertSetSQL := `
		INSERT INTO sets (visibility, title, user_id)
		VALUES ($1, $2, $3)
		RETURNING id`
	var setID string
	if err := tx.QueryRow(
		context.Background(),
		insertSetSQL,
		qSet.Visibility,
		qSet.Title,
		qSet.UserId,
	).Scan(&setID); err != nil {
		return "", fmt.Errorf("insert set: %w", err)
	}

	insertCtxSQL := `
		INSERT INTO contexts(context, set_id)
		VALUES ($1, $2)`
	if _, err := tx.Exec(
		context.Background(),
		insertCtxSQL,
		qSetContext,
		setID,
	); err != nil {
		return "", fmt.Errorf("insert context: %w", err)
	}

	if err := tx.Commit(context.Background()); err != nil {
		return "", fmt.Errorf("commit tx: %w", err)
	}
	return setID, nil
}

// --- Context CRUD ---

func (r *SetRepository) DeleteSetContext(set_id string) error {
	err := r.txDB(func(tx pgx.Tx) error {
		deleteContextSql := `
			DELETE FROM contexts
			WHERE set_id = $1`

		ct, err := tx.Exec(context.Background(), deleteContextSql, set_id)
		if err != nil {
			return err
		}

		if ct.RowsAffected() > 0 {
			r.s.Logger.Info().Str("set_id", set_id).Msg("Success: deleted context")
		} else {
			r.s.Logger.Info().Str("set_id", set_id).Msg("No context deleted (not found)")
		}
		return nil
	})
	return err
}

func (r *SetRepository) UpdateSetContext(set_id string, newContext string) (*model.SetContext, error) {
	var setContext model.SetContext

	err := r.txDB(func(tx pgx.Tx) error {
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

		setContext, err = pgx.CollectOneRow(row, pgx.RowToStructByName[model.SetContext])
		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}

		r.s.Logger.Info().Str("set_id", set_id).Msg("Success: updated context")
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &setContext, nil
}

func (r *SetRepository) GetSetContext(set_id string) (*model.SetContext, error) {
	var setContext model.SetContext

	err := r.txDB(func(tx pgx.Tx) error {
		getContextOfSet := `
			SELECT *
			FROM contexts
			WHERE set_id = $1
			`

		rows, err := tx.Query(context.Background(), getContextOfSet, set_id)
		if err != nil {
			return err
		}

		setContext, err = pgx.CollectOneRow(rows, pgx.RowToStructByName[model.SetContext])
		if err != nil {
			return fmt.Errorf("failed to map rows to struct: %w", err)
		}

		r.s.Logger.Info().Str("set_id", set_id).Msg("Success: fetched context")
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &setContext, nil
}

func (r *SetRepository) SaveContext(set_context, set_id string) (*model.SetContext, error) {
	var setContext model.SetContext

	err := r.txDB(func(tx pgx.Tx) error {
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

		setContext, err = pgx.CollectOneRow(row, pgx.RowToStructByName[model.SetContext])

		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}

		r.s.Logger.Info().Interface("context", setContext).Msg("Created new row in contexts table")
		return err
	})

	if err != nil {
		return nil, err
	}
	return &setContext, err
}

// --- Shared Access ---

func (r *SetRepository) AddSharedAccessUser(setId, userId string) error {
	err := r.txDB(func(tx pgx.Tx) error {
		addUserSql := `
			INSERT INTO shared_set_users (set_id, user_id)
			VALUES ($1, $2)
			ON CONFLICT (set_id, user_id) DO NOTHING`

		_, err := tx.Exec(context.Background(), addUserSql, setId, userId)
		if err != nil {
			return fmt.Errorf("add shared access user: %w", err)
		}
		r.s.Logger.Info().Str("set_id", setId).Str("user_id", userId).Msg("Added shared access user")
		return nil
	})

	if err != nil {
		return fmt.Errorf("AddSharedAccessUser tx: %w", err)
	}
	return nil
}

func (r *SetRepository) CheckUserAccess(userId, setId string) (bool, error) {
	var hasAccess bool

	err := r.txDB(func(tx pgx.Tx) error {
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

		r.s.Logger.Info().Str("set_id", setId).Str("user_id", userId).Bool("hasAccess", hasAccess).Msg("Checked shared access")
		return nil
	})

	if err != nil {
		return false, fmt.Errorf("CheckUserAccess tx: %w", err)
	}
	return hasAccess, nil
}

func (r *SetRepository) GetSharedAccessUsersList(setId string) ([]users.User, error) {
	var userList []users.User

	err := r.txDB(func(tx pgx.Tx) error {
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

		r.s.Logger.Info().Str("set_id", setId).Int("count", len(userList)).Msg("Retrieved shared access users")
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("GetSharedAccessUsersList tx: %w", err)
	}
	return userList, nil
}
