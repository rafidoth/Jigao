package examsHandler

import (
	"log/slog"
	"net/http"

	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/users"
)

type ExamWithCreatedBy struct {
	Exam      exams.Exam `json:"exam"`
	CreatedBy users.User `json:"created_by"`
}

func (eh *ExamsHandler) GetExamsOnASet(
	w http.ResponseWriter,
	r *http.Request,
) {
	userId, err := eh.extractUserId(r)
	if err != nil {
		slog.Warn("user_id is required")
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	setId := r.URL.Query().Get("set_id")
	if setId == "" {
		slog.Warn("set_id is required")
		http.Error(w, "set_id is required", http.StatusBadRequest)
		return
	}

	exams, err := eh.store.GetExamsBySetId(userId, setId)
	if err != nil {
		slog.Error("failed to get exams on a set DB issue", "error", err)
		w.WriteHeader(http.StatusOK)
		return
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
