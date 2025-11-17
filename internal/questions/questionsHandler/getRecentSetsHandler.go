package questionsHandler

import (
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/users"
)

type RecentSetsResponse struct {
	questionsModels.Set `json:"set"`
	users.User          `json:"owner"`
}

func (h *Handler) GetRecentSets(w http.ResponseWriter, r *http.Request) {

	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
		return
	}
	qP := h.getQueryParam(r, "recent")
	if qP == "" {
		http.Error(w, "Bad Request: limit not found", http.StatusBadRequest)
		return
	}

	rL, err := strconv.Atoi(qP)
	if err != nil {
		http.Error(w, "Bad Request: limit not found", http.StatusBadRequest)
		return
	}

	// func (s Store) GetRecentSets(limit int, user_id string) ([]*models.Set, error) {
	recentSets, err := h.store.GetRecentSets(rL, uid)
	if err != nil {
		http.Error(w, "Failed to fetch recent sets", http.StatusInternalServerError)
		slog.Error("Recent Set Fetching Issue", "error", err)
	}
	var resp []RecentSetsResponse

	for _, set := range recentSets {
		fmt.Println(*set)
		user, err := h.usersStore.GetUserFromId(set.UserId)
		if err != nil {
			http.Error(w, "Internal Server Error: user not found", http.StatusInternalServerError)
			return
		}
		resp = append(resp, RecentSetsResponse{
			Set:  *set,
			User: user,
		})
	}
	fmt.Println(resp)

	w.WriteHeader(http.StatusOK)
	err = h.sendJson(w, resp)
	if err != nil {
		slog.Warn("failed to create new set json convertion issue")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

}
