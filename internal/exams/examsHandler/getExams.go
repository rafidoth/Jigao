package examsHandler

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/exams/models"
	"github.com/rafidoth/onlyexams/internal/users"
	"github.com/rafidoth/onlyexams/internal/utils"
)

type ExamWithCreatedBy struct {
	Exam      models.Exam `json:"exam"`
	CreatedBy users.User  `json:"created_by"`
}

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
	fmt.Println("userId extracted from context ", userId)

	setId := r.URL.Query().Get("set_id")
	if setId == "" {
		slog.Warn("set_id is required")
		http.Error(w, "set_id is required", http.StatusBadRequest)
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

func (eh *ExamsHandler) getExamsBySetId(setId string) ([]ExamWithCreatedBy, error) {
	exams, err := eh.store.GetExamsBySetId(setId)
	fmt.Println("exams fetched with userId ", exams)
	if err != nil {
		slog.Error("failed to get exams on a set DB issue", "error", err)
		return nil, err
	}
	var examList []ExamWithCreatedBy
	for _, exam := range exams {
		user, err := eh.uStore.GetUserFromId(exam.UserId)
		if err != nil {
			slog.Error("failed to get user", "error", err)
			continue
		}
		examList = append(examList, ExamWithCreatedBy{
			Exam:      exam,
			CreatedBy: user,
		})
	}
	return examList, nil

}
