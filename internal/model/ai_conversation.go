package model

import "time"

type AIConversationMessageInput struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AIConversationMessage struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateAIConversationRequest struct {
	Messages []AIConversationMessageInput `json:"messages"`
}

type AppendAIConversationMessageRequest struct {
	Message AIConversationMessageInput `json:"message"`
}

type CreateAIConversationResponse struct {
	ConversationID string    `json:"conversation_id"`
	Title          string    `json:"title"`
	CreatedAt      time.Time `json:"created_at"`
}

type AppendAIConversationMessageResponse struct {
	ConversationID string                `json:"conversation_id"`
	Message        AIConversationMessage `json:"message"`
}
