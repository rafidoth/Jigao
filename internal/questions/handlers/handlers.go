package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/questions/models"
)

type Storage interface {
	CreateNewSet(*models.Set) (*models.Set, error)
	GetASet(*models.Set) (*models.Set, error)
	UpdateASet(*models.Set) (*models.Set, error)
	DeleteASet(*models.Set) (*models.Set, error)
	SaveContext(string, string) (*models.SetContext, error)
	GetRecentSets(int, string) ([]*models.Set, error)
	GetSetContext(string) (*models.SetContext, error)
	UpdateSetContext(string, string) (*models.SetContext, error)
	DeleteSetContext(string) error
	CreateANewQuestionInASet(models.Question,
		[]models.Choice, models.Answer, string) error
	CreateSetWithContext(*models.Set, string) error
	GetAllQuestionsInASet(string) ([]models.CompleteQuestion, error)
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

func (h *Handler) extractUserId(r *http.Request) (string, error) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok {
		return "", errors.New("Unable to extract user id from http.Request")
	}
	return uid, nil
}
