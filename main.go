package main

import (
	"log/slog"
	"os"

	"github.com/rafidoth/onlyexams/config"
	"github.com/rafidoth/onlyexams/db"
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

	questionsStore := store.NewStore(db.GetPgxPool())
	questionsHandler := handlers.NewHandler(questionsStore)

	application := NewServer(questionsHandler, cfg)
	application.Start(cfg.Port)
}
