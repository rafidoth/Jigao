package service

import (
	"context"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/rafidoth/onlyexams/internal/config"
	"github.com/rs/zerolog"
)

type AI struct {
	log zerolog.Logger
	cfg *config.Config
}

func NewAI(logger zerolog.Logger, cfg *config.Config) *AI {
	return &AI{
		log: logger,
		cfg: cfg,
	}
}

func (ai *AI) CompleteChat(
	ctx context.Context,
	messages []openai.ChatCompletionMessageParamUnion,
	tools []openai.ChatCompletionToolUnionParam,
) (*openai.ChatCompletion, error) {
	client := openai.NewClient(
		option.WithAPIKey(ai.cfg.AI.GROQ_KEY),
		option.WithBaseURL("https://api.groq.com/openai/v1"),
	)
	params := openai.ChatCompletionNewParams{
		Messages: messages,
		Tools:    tools,
	}

	completion, err := client.Chat.Completions.New(ctx, params)
	return completion, err
}

// prompt := `
// 	You are a question maker assistant. You have four tools. Follow these rules:
//
// 		Detect off‑topic: If the user’s message is not about generating educational questions, call unrelated_prompt and stop.
//
// 		Extract parameters: From the conversation history, determine:
//
// 			topic_or_context: the subject or text to generate questions from.
//
// 			num_questions: integer (1‑10) if provided.
//
// 			types: list from [mcq, true‑false, fill‑in‑the‑blanks, short questions].
//
// 			difficulty: one of easy, medium, hard.
//
// 		Missing parameters? If any of num_questions, types, difficulty is missing, call ask_missing_parameters with the missing list, allowed options, and the current context. Do not proceed.
//
// 		All parameters present? Call confirm_parameters with the full set. After that, the user will answer with either "CONFIRM_GENERATE" or "EDIT_PARAMETERS
//
// 		You must choose a tool.
// 		".
//
// `
