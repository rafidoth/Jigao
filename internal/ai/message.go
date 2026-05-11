package ai

import "github.com/openai/openai-go/v3"

func NewMessage(role, content string) openai.ChatCompletionMessageParamUnion {
	switch role {
	case "developer":
		return openai.DeveloperMessage(content)
	case "assistant":
		return openai.DeveloperMessage(content)
	case "system":
		return openai.SystemMessage(content)
	default:
		return openai.UserMessage(content)
	}
}
