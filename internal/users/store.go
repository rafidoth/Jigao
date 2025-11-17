package users

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	db *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{
		db: pool,
	}
}

func (s *Store) txDB(fn func(tx pgx.Tx) error) error {
	tx, err := s.db.Begin(context.Background())
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

func (s *Store) InsertUserIfNotExists(userID, email, name, imageUrl string) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(
		context.Background(),
		"INSERT INTO users (id, email, name, image_url) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
		userID, email, name, imageUrl,
	)
	if err != nil {
		return err
	}

	if err := tx.Commit(context.Background()); err != nil {
		return err
	}
	return nil
}

func (s Store) GetUserFromEmail(email string) (User, error) {
	var user User
	err := s.txDB(func(tx pgx.Tx) error {
		row := tx.QueryRow(
			context.Background(),
			"SELECT id, email, name, image_url FROM users WHERE email = $1",
			email,
		)
		if scanErr := row.Scan(&user.ID, &user.Email, &user.Name, &user.ImageURL); scanErr != nil {
			return fmt.Errorf("query user by email: %w", scanErr)
		}
		return nil
	})
	return user, err
}

func (s Store) GetUserFromId(userId string) (User, error) {
	var user User
	err := s.txDB(func(tx pgx.Tx) error {
		row := tx.QueryRow(
			context.Background(),
			"SELECT id, email, name, image_url FROM users WHERE id = $1",
			userId,
		)
		if scanErr := row.Scan(&user.ID, &user.Email, &user.Name, &user.ImageURL); scanErr != nil {
			return fmt.Errorf("query user by id: %w", scanErr)
		}
		return nil
	})
	return user, err
}
