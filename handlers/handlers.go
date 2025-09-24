package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/rafidoth/onlyexams/models"
)

type Storage interface {
	CreateNewSet(*models.Set) (*models.Set, error)
}

type Handler struct {
	ctx   context.Context
	store Storage
}

func NewHandler(store Storage) *Handler {
	return &Handler{
		ctx:   context.Background(),
		store: store,
	}
}

func (h *Handler) getQueryParam(r *http.Request, want string) string {
	qP := r.URL.Query()
	p := qP.Get(want)
	return p
}

func (h *Handler) rcvJson(r *http.Request, container any) error {
	if err := json.NewDecoder(r.Body).Decode(container); err != nil {
		return err
	}
	defer r.Body.Close()
	return nil
}

func (h *Handler) sendJson(w http.ResponseWriter, obj any) error {
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(obj)
}
