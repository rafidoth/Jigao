package model

import (
	"sort"

	"github.com/jackc/pgx/v5/pgtype"
)

type Set struct {
	ID         string             `db:"id" json:"id"`
	Visibility string             `db:"visibility" json:"visibility"`
	Title      string             `db:"title" json:"title"`
	CreatedAt  pgtype.Timestamptz `db:"created_at" json:"created_at"`
	UpdatedAt  pgtype.Timestamptz `db:"updated_at" json:"updated_at"`
	UserId     string             `db:"user_id" json:"user_id"`
}

type SetContext struct {
	ID         string `db:"id" json:"id"`
	Setcontext string `db:"context" json:"context"`
	SetId      string `db:"set_id" json:"set_id"`
}

type Question struct {
	Id           string             `db:"id" json:"id"`
	Difficulty   string             `db:"difficulty" json:"difficulty"`
	QuestionType string             `db:"question_type" json:"question_type"`
	Question     string             `db:"question" json:"question"`
	SetId        string             `db:"set_id" json:"set_id"`
	CreatedAt    pgtype.Timestamptz `db:"created_at" json:"created_at"`
}

type Choice struct {
	Id         string             `db:"id" json:"id"`
	QuestionId string             `db:"question_id" json:"question_id"`
	ChoiceText string             `db:"choice" json:"choice_text"`
	Position   int                `db:"position" json:"position"`
	CreatedAt  pgtype.Timestamptz `db:"created_at" json:"created_at"`
}

type Answer struct {
	Id            string             `db:"id" json:"id"`
	QuestionId    string             `db:"question_id" json:"question_id"`
	CorrectAnswer CorrectAnswer      `db:"answer" json:"correct_answer"`
	Explanation   string             `db:"explanation" json:"explanation"`
	CreatedAt     pgtype.Timestamptz `db:"created_at" json:"created_at"`
}

type CorrectAnswer struct {
	// For multiple_choice_questions (1-indexed position)
	MCQ_CorrectChoicePosition int `json:"mcq_correct_choice_position,omitempty"`

	// For fill_in_the_blanks
	FIB_AcceptedAnswers []string `json:"fib_accepted_answers,omitempty"`
	FIB_CaseSensitive   bool     `json:"fib_case_sensitive,omitempty"`

	// For short_question
	SQ_ModelAnswer string `json:"sq_model_answer,omitempty"`

	// For true_false
	TF_CorrectChoice *bool `json:"tf_correct_choice,omitempty"`
}

type QuestionWithAnswer struct {
	Question Question
	Answer   Answer
	Choices  []Choice
}

// Deprecated: CompleteQuestion is superseded by QuestionResponse in http_responses.go.
// Use NewQuestionResponse(QuestionWithAnswer) instead of NewCompleteQuestion.
// This struct is kept temporarily for exam_service compatibility.
type CompleteQuestion struct {
	Id                string   `json:"id"`
	Question          string   `json:"text"`
	QuestionType      string   `json:"type"`
	Difficulty        string   `json:"difficulty"`
	Choices           []string `json:"choices"`
	Answer            string   `json:"answer"`
	AnswerChoiceIndex int8     `json:"answerIdx"`
	Explanation       string   `json:"explanation"`
}

// Deprecated: NewCompleteQuestion is superseded by NewQuestionResponse.
// See QuestionResponse in http_responses.go.
func NewCompleteQuestion(
	Q Question,
	c []Choice,
	a Answer,
) CompleteQuestion {
	// Sort choices by position to ensure consistent ordering
	sortedChoices := make([]Choice, len(c))
	copy(sortedChoices, c)
	sort.Slice(sortedChoices, func(i, j int) bool {
		return sortedChoices[i].Position < sortedChoices[j].Position
	})

	choices := make([]string, len(sortedChoices))
	var answerChoiceIndex int8 = -1
	var answerText string

	for i, choice := range sortedChoices {
		choices[i] = choice.ChoiceText
	}

	switch Q.QuestionType {
	case "multiple_choice_questions":
		// Find the choice index by matching the stored choice ID
		for i, choice := range sortedChoices {
			if choice.Position == a.CorrectAnswer.MCQ_CorrectChoicePosition {
				answerChoiceIndex = int8(i)
				answerText = choice.ChoiceText
				break
			}
		}
	case "true_false":
		if a.CorrectAnswer.TF_CorrectChoice != nil {
			if *a.CorrectAnswer.TF_CorrectChoice {
				answerText = "true"
			} else {
				answerText = "false"
			}
			// Find matching choice index
			for i, choice := range sortedChoices {
				if choice.ChoiceText == answerText {
					answerChoiceIndex = int8(i)
					break
				}
			}
		}
	case "fill_in_the_blanks":
		if len(a.CorrectAnswer.FIB_AcceptedAnswers) > 0 {
			answerText = a.CorrectAnswer.FIB_AcceptedAnswers[0]
		}
	case "short_question":
		answerText = a.CorrectAnswer.SQ_ModelAnswer
	}

	return CompleteQuestion{
		Id:                Q.Id,
		Question:          Q.Question,
		QuestionType:      Q.QuestionType,
		Difficulty:        Q.Difficulty,
		Answer:            answerText,
		Choices:           choices,
		AnswerChoiceIndex: answerChoiceIndex,
		Explanation:       a.Explanation,
	}
}

type ChoicesWithQuestionType struct {
	Choices      []Choice
	QuestionType string
	QuestionId   string
}

type AnswerWithQuestionInfo struct {
	CorrectAnswer CorrectAnswer
	Explanation   string
	QuestionType  string
	QuestionId    string
}
