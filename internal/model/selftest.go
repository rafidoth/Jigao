package model

import "time"

type SelfTestAnswer struct {
	MCQSelectedPosition *int    `json:"mcq_selected_position,omitempty"`
	TFSelected          *bool   `json:"tf_selected,omitempty"`
	FIBAnswer           *string `json:"fib_answer,omitempty"`
	SQAnswer            *string `json:"sq_answer,omitempty"`
}

type SelfTestSubmissionRequest struct {
	SetID             string                    `json:"set_id"`
	DurationInMinutes int                       `json:"duration_in_minutes"`
	TimeTakenSeconds  int                       `json:"time_taken_seconds"`
	Answers           map[string]SelfTestAnswer `json:"answers"`
}

type SelfTestRecord struct {
	UserID            string
	SetID             string
	DurationInMinutes int
	TimeTakenSeconds  int
	Answers           map[string]SelfTestAnswer
	CorrectCount      int
	QuestionCount     int
}

type SelfTestSubmissionResult struct {
	SelfTestID    string    `json:"self_test_id"`
	CorrectCount  int       `json:"correct_count"`
	QuestionCount int       `json:"question_count"`
	GradableCount int       `json:"gradable_count"`
	CreatedAt     time.Time `json:"created_at"`
}

// SelfTest represents a self-test record from the database
type SelfTest struct {
	ID                string
	UserID            string
	SetID             string
	DurationInMinutes int
	TimeTakenSeconds  int
	Answers           map[string]SelfTestAnswer
	CorrectCount      int
	QuestionCount     int
	CreatedAt         time.Time
}

// SelfTestResultResponse is the top-level response for fetching a self-test result
type SelfTestResultResponse struct {
	SelfTestID        string                   `json:"self_test_id"`
	SetID             string                   `json:"set_id"`
	SetTitle          string                   `json:"set_title"`
	DurationInMinutes int                      `json:"duration_in_minutes"`
	TimeTakenSeconds  int                      `json:"time_taken_seconds"`
	CorrectCount      int                      `json:"correct_count"`
	QuestionCount     int                      `json:"question_count"`
	GradableCount     int                      `json:"gradable_count"`
	CreatedAt         time.Time                `json:"created_at"`
	Questions         []SelfTestQuestionResult `json:"questions"`
}

// SelfTestQuestionResult represents a question with both correct answer and user's answer
type SelfTestQuestionResult struct {
	QuestionID string              `json:"question_id"`
	AnswerID   string              `json:"answer_id"`
	Text       string              `json:"text"`
	Type       string              `json:"type"`
	Difficulty string              `json:"difficulty"`
	Choices    []ChoiceResponse    `json:"choices,omitempty"`
	Answer     AnswerResponse      `json:"answer"`
	UserAnswer *UserAnswerResponse `json:"user_answer"`
	IsCorrect  *bool               `json:"is_correct"` // nil for short_question (not graded)
}

// UserAnswerResponse represents what the user selected/entered
type UserAnswerResponse struct {
	// For true_false
	SelectedBool *bool `json:"selected_bool,omitempty"`

	// For multiple_choice_questions
	SelectedChoicePosition int    `json:"selected_choice_position,omitempty"`
	SelectedChoiceID       string `json:"selected_choice_id,omitempty"`

	// For fill_in_the_blanks and short_question
	TextAnswer string `json:"text_answer,omitempty"`
}

// SelfTestListItem is a minimal representation for listing self-tests
type SelfTestListItem struct {
	SelfTestID string    `json:"self_test_id"`
	SetID      string    `json:"set_id"`
	CreatedAt  time.Time `json:"created_at"`
}
