package websockets

import (
	"github.com/rafidoth/onlyexams/internal/websockets/examWs"
	"github.com/rs/zerolog"
)

type Managers struct {
	Exam *examWs.Manager
}

func NewManagers(log zerolog.Logger) *Managers {
	return &Managers{
		Exam: examWs.NewManager(log),
	}
}
