package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/rafidoth/onlyexams/internal/server"
)

type AIConversationsRepository struct {
	s *server.Server
}

func NewAIConversationsRepository(s *server.Server) *AIConversationsRepository {
	return &AIConversationsRepository{
		s: s,
	}
}

func (r *AIConversationsRepository) CreateConversation(
	ctx context.Context,
	userID,
	title string,
	messagesJSON []byte,
	lastMessageAt *time.Time,
) (string, time.Time, error) {
	const query = `
		INSERT INTO conversations (user_id, title, messages, last_message_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`

	var id string
	var createdAt time.Time

	err := r.s.DB.Pool.QueryRow(ctx, query, userID, title, messagesJSON, lastMessageAt).Scan(&id, &createdAt)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("create conversation: %w", err)
	}

	return id, createdAt, nil
}

func (r *AIConversationsRepository) AppendMessage(
	ctx context.Context,
	conversationID,
	userID string,
	messageJSON []byte,
	lastMessageAt time.Time,
) (int64, error) {
	const query = `
		UPDATE conversations
		SET
			messages = COALESCE(messages, '[]'::jsonb) || jsonb_build_array($1::jsonb),
			last_message_at = $2
		WHERE id = $3 AND user_id = $4
	`

	ct, err := r.s.DB.Pool.Exec(ctx, query, messageJSON, lastMessageAt, conversationID, userID)
	if err != nil {
		return 0, fmt.Errorf("append conversation message: %w", err)
	}

	return ct.RowsAffected(), nil
}
