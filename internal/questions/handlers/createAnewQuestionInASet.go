package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/models"
)

type requestCreateNewQuestion struct {
	Question models.Question `json:"question"`
	Choices  []models.Choice `json:"choices"`
	Answer   models.Answer   `json:"answer"`
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
	body, err := io.ReadAll(r.Body)
	if err != nil {
		slog.Warn("failed to read request body", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = json.Unmarshal(body, &req)
	if err != nil {
		slog.Warn("failed to marshal request body", "error", err)
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
