package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
)

// @Summary      List exams
// @Description  Returns exams filtered by set_id (if provided) or all exams for the authenticated user
// @Tags         Exams
// @Produce      json
// @Param        set_id  query     string  false  "Optional set ID to filter exams"
// @Success      200     {array}   model.Exam
// @Failure      400     {object}  errs.HTTPError
// @Failure      401     {object}  errs.HTTPError
// @Failure      500     {object}  errs.HTTPError
// @Router       /api/v1/exams/ [get]
func (h *ExamHandler) GetExams(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "get exams: missing user-id")
		return
	}

	setID := r.URL.Query().Get("set_id")
	var examsList []model.Exam
	if setID != "" {
		examsList, err = h.svc.GetExamsBySetID(r.Context(), setID)
		if err != nil {
			writeError(h.log, w, err, "get exams failed")
			return
		}
	} else {
		examsList, err = h.svc.GetExamsByUserID(r.Context(), uid)
		if err != nil {
			writeError(h.log, w, err, "get exams failed")
			return
		}

		examsListSingleUser := []model.ExamDetailsForSingleUser{}
		for _, xm := range examsList {
			setTitle := ""
			if xm.Set != nil {
				setTitle = xm.Set.Title
			}
			examsListSingleUser = append(examsListSingleUser, model.ExamDetailsForSingleUser{
				Id:                xm.Id,
				SetId:             xm.SetId,
				Visibility:        xm.Visibility,
				Title:             xm.Title,
				SetTitle:          setTitle,
				StartTime:         xm.StartTime,
				Description:       xm.Description,
				DurationInMinutes: xm.DurationInMinutes,
				SessionStatus:     xm.SessionStatus,
				EndTime:           xm.EndTime,
			})
		}
		writeJSON(h.log, w, http.StatusOK, examsListSingleUser)
	}

}

// @Summary      Get an exam by ID
// @Description  Returns a single exam by its ID
// @Tags         Exams
// @Produce      json
// @Param        exam_id  path      string  true  "Exam ID"
// @Success      200      {object}  model.Exam
// @Failure      400      {object}  errs.HTTPError
// @Failure      401      {object}  errs.HTTPError
// @Failure      500      {object}  errs.HTTPError
// @Router       /api/v1/exams/{exam_id} [get]
func (h *ExamHandler) GetExamByID(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(h.log, w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam: missing exam_id")
		errs.NewBadRequestError("Exam Id Required", false, nil, nil, nil)
		return
	}

	exam, err := h.svc.GetExamByID(r.Context(), examID)
	if err != nil {
		writeError(h.log, w, err, "get exam by id failed")
		return
	}

	writeJSON(h.log, w, http.StatusOK, exam)
}

// GetQuestionsOfExam handles GET /exams/q/{exam_id} — returns all questions for an exam.
//
// @Summary      Get questions of an exam
// @Description  Returns all questions with choices and answers for the specified exam
// @Tags         Exams
// @Produce      json
// @Param        exam_id  path      string  true  "Exam ID"
// @Success      200      {array}   model.QuestionResponse
// @Failure      400      {object}  errs.HTTPError
// @Failure      401      {object}  errs.HTTPError
// @Failure      500      {object}  errs.HTTPError
// @Router       /api/v1/exams/q/{exam_id} [get]
func (h *ExamHandler) GetQuestionsOfExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(h.log, w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam questions: missing exam_id")
		return
	}

	questions, err := h.svc.GetQuestionsOfExam(r.Context(), examID)
	if err != nil {
		writeError(h.log, w, err, "get questions of exam failed")
		return
	}

	result := make([]model.QuestionResponse, len(questions))
	for i, qwa := range questions {
		result[i] = model.NewQuestionResponse(qwa)
	}

	writeJSON(h.log, w, http.StatusOK, result)
}
