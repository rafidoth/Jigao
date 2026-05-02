package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/users"
)

// CreateNewSet creates a new empty set with default
// visibility="private" and title="untitled".
func (s *QuestionService) CreateNewSet(
	ctx context.Context, userID string,
) (*model.Set, error) {
	s.log.Info().Str("user_id", userID).Msg("create set request")

	set := &model.Set{
		Visibility: "private",
		Title:      "untitled",
		UserId:     userID,
	}
	created, err := s.setRepo.CreateNewSet(set)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", userID).
			Msg("failed to create set")
		return nil, fmt.Errorf("create new set: %w", err)
	}

	s.log.Info().Str("user_id", userID).Str("set_id", created.ID).
		Msg("set created")
	return created, nil
}

// GetSetWithContext retrieves a set and its context after checking access.
// Returns the set, context string, and any error.
func (s *QuestionService) GetSetWithContext(
	ctx context.Context, userID, setID string,
) (*model.Set, string, error) {
	ownerUserID, err := s.AuthorizeSetAccess(ctx, userID, setID)
	if err != nil {
		return nil, "", err
	}

	qSet := &model.Set{
		ID:     setID,
		UserId: ownerUserID,
	}

	set, err := s.setRepo.GetASet(qSet)
	if err != nil {
		return nil, "", fmt.Errorf("get set: %w", err)
	}

	setContext, err := s.setRepo.GetSetContext(setID)
	setCtx := ""
	if err == nil && setContext != nil {
		setCtx = setContext.Setcontext
	}

	return set, setCtx, nil
}

// UpdateSet updates a set's visibility and title.
func (s *QuestionService) UpdateSet(
	ctx context.Context, userID, setID, visibility, title string,
) (*model.Set, error) {
	s.log.Info().Str("user_id", userID).Str("set_id", setID).
		Msg("update set request")

	qSet := &model.Set{
		ID:         setID,
		Visibility: visibility,
		Title:      title,
		UserId:     userID,
	}
	updated, err := s.setRepo.UpdateASet(qSet)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", userID).Str("set_id", setID).
			Msg("failed to update set")
		return nil, fmt.Errorf("update set: %w", err)
	}

	s.log.Info().Str("user_id", userID).Str("set_id", setID).Msg("set updated")
	return updated, nil
}

// DeleteSet deletes a set and its associated context.
func (s *QuestionService) DeleteSet(
	ctx context.Context,
	userID, setID string,
) (*model.Set, error) {
	s.log.Info().Str("user_id", userID).Str("set_id", setID).
		Msg("delete set request")

	qSet := &model.Set{
		ID:     setID,
		UserId: userID,
	}

	deleted, err := s.setRepo.DeleteASet(qSet)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", userID).Str("set_id", setID).Msg(
			"failed to delete set",
		)
		return nil, fmt.Errorf("delete set: %w", err)
	}

	s.log.Info().Str("user_id", userID).Str("set_id", setID).Msg("set deleted")

	return deleted, nil
}

// GetRecentSets returns the most recent sets for a user (owned + shared).
func (s *QuestionService) GetRecentSets(
	ctx context.Context,
	userID string,
	limit int,
) ([]*model.Set, error) {
	sets, err := s.setRepo.GetRecentSets(limit, userID)
	if err != nil {
		return nil, fmt.Errorf("get recent sets: %w", err)
	}
	return sets, nil
}

// GetRecentSetsWithOwners returns recent sets enriched with owner user info.
func (s *QuestionService) GetRecentSetsWithOwners(
	ctx context.Context,
	userID string,
	limit int,
) ([]SetWithOwner, error) {
	sets, err := s.setRepo.GetRecentSets(limit, userID)
	if err != nil {
		return nil, fmt.Errorf("get recent sets: %w", err)
	}

	results := make([]SetWithOwner, 0, len(sets))
	for _, set := range sets {
		owner, err := s.userRepo.GetUserFromId(set.UserId)
		if err != nil {
			return nil, fmt.Errorf("get owner for set %s: %w", set.ID, err)
		}
		results = append(results, SetWithOwner{Set: *set, Owner: owner})
	}
	return results, nil
}

// SetWithOwner pairs a set with its owner
// info (used by GetRecentSetsWithOwners).
type SetWithOwner struct {
	Set   model.Set  `json:"set"`
	Owner users.User `json:"owner"`
}

// ListSetsWithOwners returns accessible sets enriched with owner user info.
func (s *QuestionService) ListSetsWithOwners(
	ctx context.Context,
	requesterID string,
	createdBy string,
	visibility string,
	limit int,
	sortBy string,
	order string,
) ([]SetWithOwner, error) {
	sets, err := s.setRepo.ListSets(requesterID,
		createdBy,
		visibility,
		limit,
		sortBy,
		order,
	)
	if err != nil {
		return nil, fmt.Errorf("list sets: %w", err)
	}

	results := make([]SetWithOwner, 0, len(sets))
	for _, set := range sets {
		owner, err := s.userRepo.GetUserFromId(set.UserId)
		if err != nil {
			return nil, fmt.Errorf("get owner for set %s: %w", set.ID, err)
		}
		results = append(results, SetWithOwner{Set: *set, Owner: owner})
	}

	return results, nil
}

func (s *QuestionService) ListSetsWithOwnersCursor(
	ctx context.Context,
	requesterID,
	createdByEmail,
	visibility,
	lastSeenID string,
) ([]SetWithOwner, *string, error) {
	var (
		createdByUser *users.User
		createdByID   string
	)

	if email := strings.TrimSpace(createdByEmail); email != "" {
		usr, err := s.userRepo.GetUserFromEmail(email)
		if err != nil {
			return nil, nil, fmt.Errorf("failed createdBy user: %w", err)
		}
		createdByUser = &usr
		createdByID = usr.ID
	}

	sets, nextID, err := s.setRepo.ListSetsWithCursor(
		requesterID,
		createdByID,
		visibility,
		lastSeenID,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("list sets with cursor: %w", err)
	}

	results := make([]SetWithOwner, 0, len(sets))
	for _, set := range sets {
		if createdByUser != nil {
			results = append(results, SetWithOwner{
				Set:   *set,
				Owner: *createdByUser,
			})
		} else {
			owner, err := s.userRepo.GetUserFromId(set.UserId)
			if err != nil {
				return nil, nil, fmt.Errorf("get owner for set %s: %w", set.ID, err)
			}
			results = append(results, SetWithOwner{
				Set:   *set,
				Owner: owner,
			})
		}
	}

	return results, nextID, nil
}

// GetSetContext retrieves the context for a set.
func (s *QuestionService) GetSetContext(
	ctx context.Context,
	setID string,
) (*model.SetContext, error) {
	sc, err := s.setRepo.GetSetContext(setID)
	if err != nil {
		return nil, fmt.Errorf("get set context: %w", err)
	}
	return sc, nil
}

// Shared Access

// GetSetAccessList returns the owner + all shared users for a set.
func (s *QuestionService) GetSetAccessList(ctx context.Context, setID string) (
	[]users.User, error,
) {
	ownerID, err := s.setRepo.GetOwnerUserId(setID)
	if err != nil {
		return nil, fmt.Errorf("get owner: %w", err)
	}

	owner, err := s.userRepo.GetUserFromId(ownerID)
	if err != nil {
		return nil, fmt.Errorf("get owner user: %w", err)
	}

	sharedUsers, err := s.setRepo.GetSharedAccessUsersList(setID)
	if err != nil {
		return nil, fmt.Errorf("get shared users: %w", err)
	}

	return append(sharedUsers, owner), nil
}

// AllowSetAccess grants a user shared access to a set.
func (s *QuestionService) AllowSetAccess(
	ctx context.Context, setID, userID string,
) error {
	s.log.Info().Str("set_id", setID).Str("user_id", userID).
		Msg("grant set access request")

	if err := s.setRepo.AddSharedAccessUser(setID, userID); err != nil {
		s.log.Error().Err(err).Str("set_id", setID).Str("user_id", userID).
			Msg("failed to grant set access")
		return fmt.Errorf("allow set access: %w", err)
	}

	s.log.Info().Str("set_id", setID).Str("user_id", userID).
		Msg("set access granted")
	return nil
}
