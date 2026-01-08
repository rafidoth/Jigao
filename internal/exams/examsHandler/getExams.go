package examsHandler

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/exams/models"
	"github.com/rafidoth/onlyexams/internal/utils"
)

func (eh *ExamsHandler) GetExams(
	w http.ResponseWriter,
	r *http.Request,
) {

	userId, err := utils.ExtractUserId(r)
	if err != nil {
		slog.Warn("user_id is required to access exams resource")
		http.Error(w, "user_id is required", http.StatusUnauthorized)
		return
	}

	setId := r.URL.Query().Get("set_id")
	if setId == "" {
		// If set id not found then returning exams under user id
		examsListOfUser, err := eh.store.GetExamsListByUserId(userId)
		if err != nil {
			slog.Error("failed to get exams for user DB issue", "error", err)
			utils.WriteOk(&w)
			return
		}

		utils.WriteJSON(w, 200, examsListOfUser)
		return
	}

	examList, err := eh.getExamsBySetId(setId)
	if err != nil {
		slog.Error("failed to get exams on a set DB issue", "error", err)
		utils.WriteOk(&w)
		return
	}

	err = eh.sendJson(w, examList)
	if err != nil {
		slog.Error("failed to marshal response", "error", err)
		http.Error(
			w,
			"Internal Server Error",
			http.StatusInternalServerError,
		)
		return
	}

}

func (eh *ExamsHandler) getExamsBySetId(setId string) ([]models.Exam, error) {
	exams, err := eh.store.GetExamsBySetId(setId)
	fmt.Println("exams fetched with setId", exams)
	if err != nil {
		slog.Error("failed to get exams on a set DB issue", "error", err)
		return nil, err
	}
	for i := range exams {
		user, err := eh.uStore.GetUserFromId(exams[i].UserId)
		if err != nil {
			slog.Error("failed to get user", "error", err)
			continue
		}
		exams[i].CreatedBy = user
	}
	return exams, nil
}
