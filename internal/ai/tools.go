package ai

import (
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/packages/param"
)

type Property struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Enum        []string `json:"enum,omitempty"`
}

type ParametersSchema struct {
	Type                 string              `json:"type"`
	Properties           map[string]Property `json:"properties"`
	Required             []string            `json:"required"`
	AdditionalProperties bool                `json:"additionalProperties"`
}

type Tool struct {
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Parameters  ParametersSchema `json:"parameters"`
	Strict      bool             `json:"strict"`
}

func (t *Tool) CreateNew() openai.ChatCompletionToolUnionParam {
	return openai.ChatCompletionFunctionTool(openai.FunctionDefinitionParam{
		Name: t.Name,
		Description: param.Opt[string]{
			Value: t.Description,
		},
		Strict: param.Opt[bool]{
			Value: t.Strict,
		},
		Parameters: map[string]any{
			"type":                 "object",
			"properties":           t.Parameters.Properties,
			"required":             t.Parameters.Required,
			"additionalProperties": t.Parameters.AdditionalProperties,
		},
	})
}
