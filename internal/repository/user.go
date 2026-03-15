package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/server"
	"github.com/rafidoth/onlyexams/internal/users"
)

type UserRepository struct {
	s *server.Server
}

func NewUserRepository(s *server.Server) *UserRepository {
	return &UserRepository{s: s}
}

func (r *UserRepository) txDB(fn func(tx pgx.Tx) error) error {
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

func (r *UserRepository) InsertUserIfNotExists(userID, email, name, imageUrl string) error {
	tx, err := r.s.DB.Pool.Begin(context.Background())
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

func (r *UserRepository) GetUserFromEmail(email string) (users.User, error) {
	var user users.User
	err := r.txDB(func(tx pgx.Tx) error {
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

func (r *UserRepository) GetUserFromId(userId string) (users.User, error) {
	var user users.User
	err := r.txDB(func(tx pgx.Tx) error {
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
