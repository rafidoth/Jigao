package questionsHandler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
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
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	err = json.Unmarshal(body, &req)
	if err != nil {
		slog.Warn("failed to marshal request body", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

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

	fmt.Println("grpc response :", resp)
	for _, que := range resp.Questions {
		q := questionsModels.Question{
			Question:     que.Question.Question,
			Difficulty:   que.Question.Difficulty,
			QuestionType: que.Question.QuestionType,
		}
		var chs []questionsModels.Choice
		for _, choice := range que.Choices {
			chs = append(chs, questionsModels.Choice{
				ChoiceText: choice.ChoiceText,
			})
		}

		a := questionsModels.Answer{
			AnswerText:  que.Answer.Answer,
			Explanation: que.Answer.Explanation,
		}
		h.store.CreateANewQuestionInASet(q, chs, a, setID)
	}

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
