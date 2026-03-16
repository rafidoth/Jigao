package model

import "sort"

type QuestionResponse struct {
	QuestionID string           `json:"question_id"`
	AnswerID   string           `json:"answer_id"`
	Text       string           `json:"text"`
	Type       string           `json:"type"`
	Difficulty string           `json:"difficulty"`
	Choices    []ChoiceResponse `json:"choices,omitempty"`
	Answer     AnswerResponse   `json:"answer"`
}

type ChoiceResponse struct {
	ChoiceID string `json:"choice_id"`
	Text     string `json:"text"`
	Position int    `json:"position"`
}

type AnswerResponse struct {
	Explanation           string   `json:"explanation"`
	CorrectChoicePosition int      `json:"correct_choice_position,omitempty"`
	CorrectChoiceID       string   `json:"correct_choice_id,omitempty"`
	CorrectBool           *bool    `json:"correct_bool,omitempty"`
	AcceptedAnswers       []string `json:"accepted_answers,omitempty"`
	CaseSensitive         bool     `json:"case_sensitive,omitempty"`
	ModelAnswer           string   `json:"model_answer,omitempty"`
}

func NewQuestionResponse(qwa QuestionWithAnswer) QuestionResponse {
	q := qwa.Question
	a := qwa.Answer

	// Sort choices by position
	sorted := make([]Choice, len(qwa.Choices))
	copy(sorted, qwa.Choices)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Position < sorted[j].Position
	})

	// Build ChoiceResponse slice
	var choices []ChoiceResponse
	if len(sorted) > 0 {
		choices = make([]ChoiceResponse, len(sorted))
		for i, c := range sorted {
			choices[i] = ChoiceResponse{
				ChoiceID: c.Id,
				Text:     c.ChoiceText,
				Position: c.Position,
			}
		}
	}

	ans := AnswerResponse{
		Explanation: a.Explanation,
	}

	switch q.QuestionType {
	case "multiple_choice_questions":
		ans.CorrectChoicePosition = a.CorrectAnswer.MCQ_CorrectChoicePosition
		for _, c := range sorted {
			if c.Position == a.CorrectAnswer.MCQ_CorrectChoicePosition {
				ans.CorrectChoiceID = c.Id
				break
			}
		}

	case "true_false":
		ans.CorrectBool = a.CorrectAnswer.TF_CorrectChoice

	case "fill_in_the_blanks":
		ans.AcceptedAnswers = a.CorrectAnswer.FIB_AcceptedAnswers
		ans.CaseSensitive = a.CorrectAnswer.FIB_CaseSensitive

	case "short_question":
		ans.ModelAnswer = a.CorrectAnswer.SQ_ModelAnswer
	}

	return QuestionResponse{
		QuestionID: q.Id,
		AnswerID:   a.Id,
		Text:       q.Question,
		Type:       q.QuestionType,
		Difficulty: q.Difficulty,
		Choices:    choices,
		Answer:     ans,
	}
}
