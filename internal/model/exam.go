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
	StartMode         string     `db:"start_mode" json:"start_mode"`
	SessionStatus     string     `db:"session_status" json:"session_status"`
	InviteCode        *string    `db:"invite_code" json:"invite_code"`
	ProctoringEnabled bool       `db:"proctoring_enabled" json:"proctoring_enabled"`
	CameraRequired    bool       `db:"camera_required" json:"camera_required"`
	MaxViolations     *int       `db:"max_violations" json:"max_violations"`
	EndTime           time.Time  `db:"end_time" json:"end_time"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at" json:"updated_at"`
	CreatedBy         users.User `db:"-" json:"created_by"`
	Set               *Set       `db:"-" json:"set"`
}

type ExamDetailsForSingleSet struct {
	Id                   string    `json:"id"`
	SetId                string    `json:"set_id"`
	Visibility           string    `json:"visibility"`
	Title                string    `json:"title"`
	SetTitle             string    `json:"set_title"`
	StartTime            time.Time `json:"start_time"`
	Description          string    `json:"description"`
	DurationInMinutes    int       `json:"duration"`
	SessionStatus        string    `json:"session_status"`
	EndTime              time.Time `json:"end_time"`
	StartMode            string    `db:"start_mode" json:"start_mode"`
	OwnerName            string    `json:"owner_name"`
	OwnerProfileImageUrl string    `json:"owner_profile_image_url"`
}

type ExamDetailsForSingleUser struct {
	Id                string    `json:"id"`
	SetId             string    `json:"set_id"`
	Visibility        string    `json:"visibility"`
	Title             string    `json:"title"`
	SetTitle          string    `json:"set_title"`
	StartTime         time.Time `json:"start_time"`
	Description       string    `json:"description"`
	DurationInMinutes int       `json:"duration"`
	SessionStatus     string    `json:"session_status"`
	EndTime           time.Time `json:"end_time"`
}

type ExamCreate struct {
	UserID            string    `json:"user_id"`
	SetID             string    `json:"set_id"`
	Visibility        string    `json:"visibility"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	StartTime         time.Time `json:"start_time"`
	DurationInMinutes int       `json:"duration_in_minutes"`
	StartMode         string    `json:"start_mode"`
	ProctoringEnabled bool      `json:"proctoring_enabled"`
	CameraRequired    bool      `json:"camera_required"`
}

type ExamUpdate struct {
	ID                string     `json:"id"`
	UserID            string     `json:"user_id"`
	Title             *string    `json:"title,omitempty"`
	Description       *string    `json:"description,omitempty"`
	StartTime         *time.Time `json:"start_time,omitempty"`
	DurationInMinutes *int       `json:"duration_in_minutes,omitempty"`
	StartMode         *string    `json:"start_mode,omitempty"`
	SessionStatus     *string    `json:"session_status,omitempty"`
	ProctoringEnabled *bool      `json:"proctoring_enabled,omitempty"`
	CameraRequired    *bool      `json:"camera_required,omitempty"`
	MaxViolations     *int       `json:"max_violations,omitempty"`
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
