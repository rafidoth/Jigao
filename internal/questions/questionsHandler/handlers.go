package questionsHandler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/users"
	"github.com/rafidoth/onlyexams/proto"
)

type Storage interface {
	CreateNewSet(*questionsModels.Set) (*questionsModels.Set, error)
	GetASet(*questionsModels.Set) (*questionsModels.Set, error)
	UpdateASet(*questionsModels.Set) (*questionsModels.Set, error)
	DeleteASet(*questionsModels.Set) (*questionsModels.Set, error)
	SaveContext(string, string) (*questionsModels.SetContext, error)
	GetRecentSets(int, string) ([]*questionsModels.Set, error)
	GetSetContext(string) (*questionsModels.SetContext, error)
	UpdateSetContext(string, string) (*questionsModels.SetContext, error)
	DeleteSetContext(string) error
	CreateANewQuestionInASet(questionsModels.Question,
		[]questionsModels.Choice, questionsModels.Answer, string) error
	CreateSetWithContext(*questionsModels.Set, string) error
	GetAllQuestionsInASet(string) ([]questionsModels.CompleteQuestion, error)
	CreateSetWithContextRetSetId(*questionsModels.Set, string) (string, error)
	GetVisibility(string) (string, error)
	GetOwnerUserId(string) (string, error)
	CheckUserAccess(string, string) (bool, error)
	GetSharedAccessUsersList(string) ([]users.User, error)
	AddSharedAccessUser(string, string) error
	CreateQuestionsInBatchReturnIds(questions []questionsModels.Question) ([]string, error)
	SaveChoicesInBatch(choicesWithQuestionType []questionsModels.ChoicesWithQuestionType) (map[string][]questionsModels.Choice, error)
	SaveAnswersInBatch(answersWithQuestionInfo []questionsModels.AnswerWithQuestionInfo, choicesMap map[string][]questionsModels.Choice) error
}

type UsersStorage interface {
	GetUserFromId(userId string) (users.User, error)
	GetUserFromEmail(email string) (users.User, error)
}

type Handler struct {
	ctx             context.Context
	store           Storage
	usersStore      UsersStorage
	aiServiceClient proto.JigaoAIClient
}

func New(store Storage, usersStorage UsersStorage, ai proto.JigaoAIClient) *Handler {
	return &Handler{
		ctx:             context.Background(),
		store:           store,
		usersStore:      usersStorage,
		aiServiceClient: ai,
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
