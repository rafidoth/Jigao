package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/internal/users"
	"github.com/rs/zerolog"
)

type UserService struct {
	userRepo *repository.UserRepository
	log      zerolog.Logger
}

func NewUserService(userRepo *repository.UserRepository, log zerolog.Logger) *UserService {
	return &UserService{userRepo: userRepo, log: log}
}

// LoginUser inserts a user if they don't already exist (upsert on id).
func (s *UserService) LoginUser(ctx context.Context, userID, email, name, imageURL string) error {
	s.log.Info().
		Str("user_id", userID).
		Str("email", email).
		Msg("login user request")

	if err := s.userRepo.InsertUserIfNotExists(userID, email, name, imageURL); err != nil {
		s.log.Error().Err(err).Str("user_id", userID).Msg("failed to login user")
		return fmt.Errorf("login user: %w", err)
	}

	s.log.Info().Str("user_id", userID).Msg("user login handled")
	return nil
}

// GetUserByEmail retrieves a user by their email address.
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (users.User, error) {
	s.log.Info().Str("email", email).Msg("get user by email request")

	user, err := s.userRepo.GetUserFromEmail(email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			s.log.Warn().Str("email", email).Msg("user not found by email")
			return users.User{}, errs.NewNotFoundError("User not found", false, nil)
		}
		s.log.Error().Err(err).Str("email", email).Msg("failed to get user by email")
		return users.User{}, fmt.Errorf("get user by email: %w", err)
	}

	s.log.Info().Str("user_id", user.ID).Msg("get user by email success")
	return user, nil
}

// GetUserByID retrieves a user by their ID.
func (s *UserService) GetUserByID(ctx context.Context, userID string) (users.User, error) {
	s.log.Info().Str("user_id", userID).Msg("get user by id request")

	user, err := s.userRepo.GetUserFromId(userID)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", userID).Msg("failed to get user by id")
		return users.User{}, fmt.Errorf("get user by id: %w", err)
	}

	s.log.Info().Str("user_id", userID).Msg("get user by id success")
	return user, nil
}
