package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rafidoth/onlyexams/config"
)

type Database struct {
	conn *pgxpool.Pool
	cfg  *config.Config
}

func NewDatabase(cfg *config.Config) (*Database, error) {
	if cfg.DB.DBString == "" {
		fmt.Println("Failed to get env : DBSTRING")
		os.Exit(1)
	}

	conn, err := pgxpool.New(context.Background(), cfg.DB.DBString)

	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}

	return &Database{conn: conn}, nil
}

func (d *Database) GetPgxPool() *pgxpool.Pool {
	return d.conn
}

func (d *Database) Close() {
	d.conn.Close()
}
