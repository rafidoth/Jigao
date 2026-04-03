package main

import (
	"os"

	"github.com/rafidoth/onlyexams/internal/config"
	"github.com/rafidoth/onlyexams/internal/handler"
	"github.com/rafidoth/onlyexams/internal/logger"
	"github.com/rafidoth/onlyexams/internal/repository"
	"github.com/rafidoth/onlyexams/internal/router"
	"github.com/rafidoth/onlyexams/internal/server"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rafidoth/onlyexams/internal/websockets"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		os.Exit(1)
	}

	loggerService := logger.NewLoggerService(cfg.Observability)
	log := logger.NewLoggerWithService(cfg.Observability, loggerService)

	srv, err := server.New(cfg, &log, loggerService)
	if err != nil {
		log.Error().Err(err).Msg("failed to create server")
		os.Exit(1)
	}

	repos := repository.NewRepositories(srv)

	svc := service.NewServices(repos, log)

	wsManagers := websockets.NewManagers(log)
	handlers := handler.NewHandlers(svc, wsManagers, log)

	mux := router.New(srv, handlers)

	srv.SetupHTTPServer(mux)

	go wsManagers.Exam.Run()

	if err := srv.Start(); err != nil {
		log.Error().Err(err).Msg("server stopped")
		os.Exit(1)
	}
}
