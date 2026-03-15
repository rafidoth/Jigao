package questionsHandler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/utils"
)

// GenerateNewSetRes was previously in generateNewQuestionSet.go which was deleted
// during proto/gRPC removal. Kept here for old code compatibility.
type GenerateNewSetRes struct {
	SetId string `json:"set_id"`
}

type GeneratedQuestion struct {
	Question questionsModels.Question `json:"question"`
	Answer   questionsModels.Answer   `json:"answer"`
	Choices  []questionsModels.Choice `json:"choices"`
}

type SaveGeneratedQuestionsReq struct {
	Title     string              `json:"title"`
	Questions []GeneratedQuestion `json:"questions"`
	Context   string              `json:"context"`
}

func (h *Handler) SaveGeneratedQuestionsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Failed to extract user ID", http.StatusBadRequest)
		return
	}
	var req SaveGeneratedQuestionsReq
	utils.ExtractRequestBody(r, &req)

	var setID string
	set := &questionsModels.Set{
		Visibility: "public",
		Title:      req.Title,
		UserId:     uid,
	}
	setID, err = h.store.CreateSetWithContextRetSetId(set, req.Context)
	if err != nil {
		slog.Error("failed to create set", "error", err)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == pgerrcode.ForeignKeyViolation {
				if pgErr.ConstraintName == "sets_user_id_fkey" {
					slog.Error("failed to create set",
						"error", "The User ID provided does not exist (FK Constraint)",
						"constraint", pgErr.ConstraintName,
					)
					w.WriteHeader(http.StatusUnauthorized)
					w.Write([]byte(`{"user": "not found"}`))
					return
				}
			}
		}
	}

	var questions []questionsModels.Question
	var choicesWithQuestionType []questionsModels.ChoicesWithQuestionType
	var answersWithQuestionInfo []questionsModels.AnswerWithQuestionInfo
	for _, que := range req.Questions {
		q := questionsModels.Question{
			Question:     que.Question.Question,
			Difficulty:   que.Question.Difficulty,
			QuestionType: que.Question.QuestionType,
			SetId:        setID,
		}
		questions = append(questions, q)
		var choices []questionsModels.Choice
		for _, choice := range que.Choices {
			c := questionsModels.Choice{
				ChoiceText: choice.ChoiceText,
			}
			choices = append(choices, c)
		}
		choicesWithQuestionType = append(choicesWithQuestionType, questionsModels.ChoicesWithQuestionType{
			Choices:      choices,
			QuestionType: que.Question.QuestionType,
		})

		answersWithQuestionInfo = append(answersWithQuestionInfo, questionsModels.AnswerWithQuestionInfo{
			QuestionType: que.Question.QuestionType,
			AnswerText:   que.Answer.AnswerText,
			Explanation:  que.Answer.Explanation,
		})
	}

	if len(questions) != len(choicesWithQuestionType) {
		slog.Error("mismatched questions and choices length",
			"questions_length", len(questions),
			"choices_length", len(choicesWithQuestionType),
		)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	qIds, err := h.store.CreateQuestionsInBatchReturnIds(questions)
	if err != nil {
		slog.Error("failed to create questions in batch", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	for i, qid := range qIds {
		choicesWithQuestionType[i].QuestionId = qid
		answersWithQuestionInfo[i].QuestionId = qid
	}

	mp, err := h.store.SaveChoicesInBatch(choicesWithQuestionType)
	err = h.store.SaveAnswersInBatch(answersWithQuestionInfo, mp)

	jsonRes, err := json.Marshal(&GenerateNewSetRes{
		SetId: setID,
	})

	if err != nil {
		slog.Warn("failed to marshal response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(jsonRes)
	if err != nil {
		slog.Warn("failed to write response", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
