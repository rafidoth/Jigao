package model

import (
	"time"

	"github.com/rafidoth/onlyexams/internal/users"
)

type Exam struct {
	Id                string     `db:"id" json:"id"`
	SetId             string     `db:"set_id" json:"set_id"`
	UserId            string     `db:"user_id" json:"user_id"`
	Visibility        string     `db:"visibility" json:"visibility"`
	Title             string     `db:"title" json:"title"`
	StartTime         time.Time  `db:"start_time" json:"start_time"`
	Description       string     `db:"description" json:"description"`
	DurationInMinutes int        `db:"duration" json:"duration"`
	EndTime           time.Time  `db:"end_time" json:"end_time"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at" json:"updated_at"`
	CreatedBy         users.User `db:"-" json:"created_by"`
	Set               *Set       `db:"-" json:"set"`
}

type EvaluatedAnswerType struct {
	UserAnswer    string `json:"answer"`
	IsCorrect     bool   `json:"is_correct"`
	CorrectAnswer string `json:"correct_answer"`
}

type EvaluationResult struct {
	Score       int                            `json:"score"`
	AnswerSheet map[string]EvaluatedAnswerType `json:"answer_sheet"`
	CreatedAt   time.Time                      `json:"created_at"`
}
