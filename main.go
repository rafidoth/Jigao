package main

import (
	"log/slog"
	"os"

	"github.com/rafidoth/onlyexams/config"
	"github.com/rafidoth/onlyexams/db"
	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/exams/examsHandler"
	"github.com/rafidoth/onlyexams/internal/exams/examsStore"
	"github.com/rafidoth/onlyexams/internal/questions/questionsHandler"
	"github.com/rafidoth/onlyexams/internal/questions/questionsStore"
	"github.com/rafidoth/onlyexams/internal/users"
	"github.com/rafidoth/onlyexams/proto"
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

	aiSvc := proto.NewAiServiceClient()
	defer aiSvc.Close()

	uStore := users.NewStore(db.GetPgxPool())
	qStore := questionsStore.New(db.GetPgxPool())
	qH := questionsHandler.New(qStore, uStore, aiSvc.Client)

	eStore := examsStore.New(db.GetPgxPool())
	eHub := exams.New(eStore)
	eH := examsHandler.New(eHub, eStore, qStore, uStore)

	uH := users.NewHandler(uStore)

	go eHub.Run()

	application := NewServer(qH, eH, uH, cfg)
	application.Start(cfg.Port)
}
