package config

import (
	"os"

	_ "github.com/joho/godotenv/autoload"
)

type Config struct {
	Logs             LogConfig
	DB               PostgresConfig
	Port             string
	CorsAllowed      string
	CLERK_SECRET_KEY string
}

type LogConfig struct {
	Style string
	Level string
}

type PostgresConfig struct {
	DBString string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		Port: os.Getenv("PORT"),
		Logs: LogConfig{
			Style: os.Getenv("LOG_STYLE"),
			Level: os.Getenv("LOG_LEVEL"),
		},
		DB: PostgresConfig{
			DBString: os.Getenv("DBSTRING"),
		},
		CorsAllowed:      os.Getenv("CORS_ALLOWED_ORIGIN"),
		CLERK_SECRET_KEY: os.Getenv("CLERK_SECRET_KEY"),
	}

	return cfg, nil
}
