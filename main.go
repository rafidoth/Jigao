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
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		os.Exit(1)
	}

	loggerService := logger.NewLoggerService(cfg.Observability)
	log := logger.NewLoggerWithService(cfg.Observability, loggerService)

	// Create server (initializes database)
	srv, err := server.New(cfg, &log, loggerService)
	if err != nil {
		log.Error().Err(err).Msg("failed to create server")
		os.Exit(1)
	}

	// Create repository layer
	repos := repository.NewRepositories(srv)

	// Create service layer
	svc := service.NewServices(repos)

	// Create handler layer
	handlers := handler.NewHandlers(svc)

	// Create router with all routes and middleware
	mux := router.New(srv, handlers)

	// Wire HTTP server
	srv.SetupHTTPServer(mux)

	// Start serving
	if err := srv.Start(); err != nil {
		log.Error().Err(err).Msg("server stopped")
		os.Exit(1)
	}
}
