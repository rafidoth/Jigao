package ai

import (
	"context"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/rafidoth/onlyexams/internal/config"
)

type AI struct {
	client openai.Client
}

func NewAI(cfg *config.Config) *AI {
	return &AI{
		client: openai.NewClient(
			option.WithAPIKey(cfg.AI.GROQ_KEY),
			option.WithBaseURL(cfg.AI.GROQ_BASE_URL),
		),
	}
}

func (ai *AI) CompleteChat(
	ctx context.Context,
	messages []openai.ChatCompletionMessageParamUnion,
	tools []openai.ChatCompletionToolUnionParam,
) (*openai.ChatCompletion, error) {
	params := openai.ChatCompletionNewParams{
		Messages: messages,
		Tools:    tools,
	}

	completion, err := ai.client.Chat.Completions.New(ctx, params)
	return completion, err
}
