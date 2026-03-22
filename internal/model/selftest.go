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
