package models

import "time"

type Exam struct {
	Id                string    `db:"id"`
	SetId             string    `db:"set_id"`
	Title             string    `db:"title"`
	StartTime         time.Time `db:"start_time"`
	DurationInMinutes int       `db:"duration"`
	EndTime           time.Time `db:"end_time"`
	CreatedAt         time.Time `db:"created_at"`
	UpdatedAt         time.Time `db:"updated_at"`
}

// type ExamParticipant struct {
// 	Id         string    `json:"id" db:"id"`
// 	ExamId     string    `json:"exam_id" db:"exam_id"`
// 	UserId     string    `json:"user_id" db:"user_id"`
// 	StartedAt  time.Time `json:"started_at" db:"started_at"`
// 	FinishedAt time.Time `json:"finished_at" db:"finished_at"`
// 	Score      int       `json:"score" db:"score"`
// 	CreatedAt  time.Time `json:"created_at" db:"created_at"`
// 	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
// }
