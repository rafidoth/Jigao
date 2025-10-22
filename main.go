package main

import (
	"log/slog"
	"os"

	"github.com/rafidoth/onlyexams/config"
	"github.com/rafidoth/onlyexams/db"
	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/exams/examsHandler"
	"github.com/rafidoth/onlyexams/internal/exams/examsStore"
	"github.com/rafidoth/onlyexams/internal/questions/handlers"
	"github.com/rafidoth/onlyexams/internal/questions/store"
)

func init() {
	// setting up the logger
	opts := &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelDebug,
	}
	handler := slog.NewTextHandler(os.Stdout, opts)
	myLogger := slog.New(handler)
	slog.SetDefault(myLogger)
}

func main() {
	slog.Info("OnlyExam is starting .....")

	cfg, err := config.LoadConfig()
	if err != nil {
		slog.Error("problem loading env vars", "error", err)
	}

	db, err := db.NewDatabase(cfg)
	if err != nil {
		slog.Error("unable to configure db : ", "error", err)
	}

	qStore := store.NewStore(db.GetPgxPool())
	qH := handlers.NewHandler(qStore)

	eStore := examsStore.NewStore(db.GetPgxPool())
	eHub := exams.NewExamHub(eStore)
	eH := examsHandler.NewHandler(eHub, eStore)
	go eHub.Run()

	application := NewServer(qH, eH, cfg)
	application.Start(cfg.Port)
}
