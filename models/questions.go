package models

import "github.com/jackc/pgx/v5/pgtype"

type Set struct {
	ID         string              `db:"id"`
	Visibility string              `db:"visibility"`
	Title      string              `db:"title"`
	CreatedAt  *pgtype.Timestamptz `db:"created_at"`
	UpdatedAt  *pgtype.Timestamptz `db:"updated_at"`
	UserId     string              `db:"user_id"`
}
