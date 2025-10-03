package models

import "github.com/jackc/pgx/v5/pgtype"

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
	CreatedAt  pgtype.Timestamptz `db:"created_at" json:"created_at"`
}

type Answer struct {
	Id          string             `db:"id" json:"id"`
	QuestionId  string             `db:"question_id" json:"question_id"`
	ChoiceId    string             `db:"choice_id" json:"choice_id"`
	AnswerText  string             `db:"answer" json:"answer"`
	Explanation string             `db:"explanation" json:"explanation"`
	CreatedAt   pgtype.Timestamptz `db:"created_at" json:"created_at"`
}
