package questionsHandler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

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

	fmt.Println("Generating Request Body : ", req)
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
		return
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
