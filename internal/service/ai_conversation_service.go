package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rs/zerolog"
)

const maxAIConversationMessageContentLength = 8000

type AIConversationService struct {
	repo *repository.AIConversationsRepository
	log  zerolog.Logger
}

func NewAIConversationService(repo *repository.AIConversationsRepository, log zerolog.Logger) *AIConversationService {
	return &AIConversationService{repo: repo, log: log}
}

func (s *AIConversationService) CreateConversation(
	ctx context.Context,
	userID string,
	request model.CreateAIConversationRequest,
) (*model.CreateAIConversationResponse, error) {
	preparedMessages, err := prepareMessagesForCreate(request.Messages)
	if err != nil {
		return nil, err
	}

	title := deriveConversationTitle(preparedMessages)

	messagesJSON, err := json.Marshal(preparedMessages)
	if err != nil {
		return nil, fmt.Errorf("marshal conversation messages: %w", err)
	}

	var lastMessageAt *time.Time
	if len(preparedMessages) > 0 {
		last := preparedMessages[len(preparedMessages)-1].CreatedAt
		lastMessageAt = &last
	}

	conversationID, createdAt, err := s.repo.CreateConversation(
		ctx,
		userID,
		title,
		messagesJSON,
		lastMessageAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create conversation: %w", err)
	}

	return &model.CreateAIConversationResponse{
		ConversationID: conversationID,
		Title:          title,
		CreatedAt:      createdAt,
	}, nil
}

func (s *AIConversationService) AppendMessage(
	ctx context.Context,
	userID,
	conversationID string,
	request model.AppendAIConversationMessageRequest,
) (*model.AppendAIConversationMessageResponse, error) {
	if strings.TrimSpace(conversationID) == "" {
		return nil, errs.NewBadRequestError("conversation_id is required", false, nil, nil, nil)
	}

	preparedMessage, err := prepareMessage(request.Message)
	if err != nil {
		return nil, err
	}

	messageJSON, err := json.Marshal(preparedMessage)
	if err != nil {
		return nil, fmt.Errorf("marshal conversation message: %w", err)
	}

	rowsAffected, err := s.repo.AppendMessage(
		ctx,
		conversationID,
		userID,
		messageJSON,
		preparedMessage.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("append conversation message: %w", err)
	}

	if rowsAffected == 0 {
		return nil, errs.NewNotFoundError("Conversation not found", false, nil)
	}

	return &model.AppendAIConversationMessageResponse{
		ConversationID: conversationID,
		Message:        preparedMessage,
	}, nil
}

func prepareMessagesForCreate(messages []model.AIConversationMessageInput) ([]model.AIConversationMessage, error) {
	preparedMessages := make([]model.AIConversationMessage, 0, len(messages))
	for _, message := range messages {
		preparedMessage, err := prepareMessage(message)
		if err != nil {
			return nil, err
		}
		preparedMessages = append(preparedMessages, preparedMessage)
	}

	return preparedMessages, nil
}

func prepareMessage(message model.AIConversationMessageInput) (model.AIConversationMessage, error) {
	role := strings.TrimSpace(message.Role)
	if !isValidAIConversationRole(role) {
		return model.AIConversationMessage{}, errs.NewBadRequestError(
			"role must be one of: system, user, assistant, tool",
			false,
			nil,
			nil,
			nil,
		)
	}

	content := strings.TrimSpace(message.Content)
	if content == "" {
		return model.AIConversationMessage{}, errs.NewBadRequestError("content is required", false, nil, nil, nil)
	}

	if len(content) > maxAIConversationMessageContentLength {
		return model.AIConversationMessage{}, errs.NewBadRequestError(
			"content must be at most 8000 characters",
			false,
			nil,
			nil,
			nil,
		)
	}

	return model.AIConversationMessage{
		Role:      role,
		Content:   content,
		CreatedAt: time.Now().UTC(),
	}, nil
}

func isValidAIConversationRole(role string) bool {
	switch role {
	case "system", "user", "assistant", "tool":
		return true
	default:
		return false
	}
}

func deriveConversationTitle(messages []model.AIConversationMessage) string {
	for _, message := range messages {
		if message.Role != "user" {
			continue
		}

		content := strings.TrimSpace(message.Content)
		if content == "" {
			continue
		}

		words := strings.Fields(content)
		if len(words) > 6 {
			words = words[:6]
		}

		title := strings.Join(words, " ")
		if len(title) > 80 {
			title = strings.TrimSpace(title[:80])
		}

		if title != "" {
			return title
		}
	}

	return "New Chat"
}
