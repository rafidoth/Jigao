package questionsHandler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
	"github.com/rafidoth/onlyexams/internal/utils"
	"github.com/rafidoth/onlyexams/proto"
)

type GenerateNewSetReq struct {
	NumQuestions int    `json:"n"`
	SetContext   string `json:"context"`
	QuestionType string `json:"type"`
}

type GenerateNewSetRes struct {
	SetId string `json:"set_id"`
}

func (h *Handler) GenerateNewQuestionSet(
	w http.ResponseWriter,
	r *http.Request,
) {
	uid, err := h.extractUserId(r)
	if err != nil {
		http.Error(w, "Failed to extract user ID", http.StatusBadRequest)
		return
	}

	var req GenerateNewSetReq
	utils.ExtractRequestBody(r, &req)

	slog.Info("Request of Generating Question Set on ", "user_id", uid, "request_body", req)
	ctx := context.Background()

	gReq := &proto.GenerateQuestionsRequest{
		Quantity:     int32(req.NumQuestions),
		Context:      req.SetContext,
		QuestionType: req.QuestionType,
		Instructions: "",
	}

	resp, err := h.aiServiceClient.GenerateQuestions(ctx, gReq)
	if err != nil {
		slog.Error("failed to generate questions", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	fmt.Println("grpc response :", resp)

	var setID string
	set := &questionsModels.Set{
		Visibility: "public",
		Title:      resp.Title,
		UserId:     uid,
	}
	setID, err = h.store.CreateSetWithContextRetSetId(set, gReq.Context)
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

	for _, que := range resp.Questions {
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
			AnswerText:   que.Answer.Answer,
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
