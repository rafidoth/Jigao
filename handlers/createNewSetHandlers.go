package handlers

import (
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/models"
)

type CreateSetReq struct {
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Context    string `json:"context"`
}

type CreateSetRes struct {
	ID         string
	Visibility string
	Title      string
	Context    string
}

type SetWithContext struct {
	set     models.Set
	context string
}

func (h *Handler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}

	var req CreateSetReq
	err = h.rcvJson(r, &req)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	QuestionSet := &models.Set{
		Visibility: req.Visibility,
		Title:      req.Title,
		UserId:     uid,
	}

	QuestionSet, err = h.store.CreateNewSet(QuestionSet)
	if err != nil {
		slog.Warn("failed to create new Set DB issue", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	context := ""
	if req.Context != "" {
		sc, err := h.store.SaveContext(req.Context, QuestionSet.ID)
		if err != nil {
			slog.Warn("failed to save context row in db", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return

		}
		context = sc.Setcontext
	}

	// type CreateSetRes struct {
	// 	ID         string
	// 	Visibility string
	// 	Title      string
	// 	Context    string
	// }

	res := &CreateSetRes{
		ID:         QuestionSet.ID,
		Visibility: QuestionSet.Visibility,
		Title:      QuestionSet.Title,
		Context:    context,
	}

	w.WriteHeader(http.StatusOK)
	err = h.sendJson(w, res)
	if err != nil {
		slog.Warn("failed to create new set json convertion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

}
