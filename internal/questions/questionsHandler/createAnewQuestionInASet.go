package questionsHandler

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/utils"
)

type requestCreateNewQuestion struct {
	Question questionsModels.Question `json:"question"`
	Choices  []questionsModels.Choice `json:"choices"`
	Answer   questionsModels.Answer   `json:"answer"`
}

func (h *Handler) CreateANewQuestionInASet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}
	fmt.Println("user id:", uid)

	setId := r.URL.Query().Get("set_id")
	if setId == "" {
		http.Error(w, "Bad Request: set_id is required", http.StatusBadRequest)
		return
	}

	var req requestCreateNewQuestion
	ok := utils.ExtractRequestBody(r, &req)
	if !ok {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = h.store.CreateANewQuestionInASet(
		req.Question, req.Choices, req.Answer, setId,
	)

	if err != nil {
		slog.Warn("failed to create new question in a set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
