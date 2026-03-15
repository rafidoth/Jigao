package service

import (
	"context"
	"fmt"

	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/internal/users"
)

type UserService struct {
	userRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

// LoginUser inserts a user if they don't already exist (upsert on id).
func (s *UserService) LoginUser(ctx context.Context, userID, email, name, imageURL string) error {
	if err := s.userRepo.InsertUserIfNotExists(userID, email, name, imageURL); err != nil {
		return fmt.Errorf("login user: %w", err)
	}
	return nil
}

// GetUserByEmail retrieves a user by their email address.
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (users.User, error) {
	user, err := s.userRepo.GetUserFromEmail(email)
	if err != nil {
		return users.User{}, fmt.Errorf("get user by email: %w", err)
	}
	return user, nil
}

// GetUserByID retrieves a user by their ID.
func (s *UserService) GetUserByID(ctx context.Context, userID string) (users.User, error) {
	user, err := s.userRepo.GetUserFromId(userID)
	if err != nil {
		return users.User{}, fmt.Errorf("get user by id: %w", err)
	}
	return user, nil
}
