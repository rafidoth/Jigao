package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rafidoth/onlyexams/internal/utils"
	"github.com/rs/zerolog"
)

type AIConversationHandler struct {
	svc *service.AIConversationService
	log zerolog.Logger
}

func NewAIConversationHandler(svc *service.AIConversationService, log zerolog.Logger) *AIConversationHandler {
	return &AIConversationHandler{svc: svc, log: log}
}

// @Summary      Create AI conversation
// @Description  Creates a new AI conversation for the authenticated user
// @Tags         AIConversations
// @Accept       json
// @Produce      json
// @Param        body  body      model.CreateAIConversationRequest  true  "Initial conversation payload"
// @Success      201   {object}  object{success=bool,data=model.CreateAIConversationResponse}
// @Failure      400   {object}  errs.HTTPError
// @Failure      401   {object}  errs.HTTPError
// @Failure      500   {object}  errs.HTTPError
// @Router       /api/v1/ai/conversations [post]
func (h *AIConversationHandler) CreateConversation(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "create ai conversation: missing user-id")
		return
	}

	var req model.CreateAIConversationRequest
	if !utils.ExtractRequestBody(r, &req) {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "create ai conversation: decode body")
		return
	}

	result, err := h.svc.CreateConversation(r.Context(), uid, req)
	if err != nil {
		writeError(h.log, w, err, "create ai conversation failed")
		return
	}

	type resp struct {
		Success bool                                `json:"success"`
		Data    *model.CreateAIConversationResponse `json:"data"`
	}

	writeJSON(h.log, w, http.StatusCreated, resp{
		Success: true,
		Data:    result,
	})
}

// @Summary      Append AI conversation message
// @Description  Appends a single message to an existing AI conversation
// @Tags         AIConversations
// @Accept       json
// @Produce      json
// @Param        conversation_id  path      string                                  true  "Conversation ID"
// @Param        body             body      model.AppendAIConversationMessageRequest true  "Message payload"
// @Success      200              {object}  object{success=bool,data=model.AppendAIConversationMessageResponse}
// @Failure      400              {object}  errs.HTTPError
// @Failure      401              {object}  errs.HTTPError
// @Failure      404              {object}  errs.HTTPError
// @Failure      500              {object}  errs.HTTPError
// @Router       /api/v1/ai/conversations/{conversation_id}/messages [post]
func (h *AIConversationHandler) AppendMessage(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "append ai conversation message: missing user-id")
		return
	}

	conversationID := chi.URLParam(r, "conversation_id")
	if conversationID == "" {
		writeError(h.log, w, errs.NewBadRequestError("conversation_id is required", false, nil, nil, nil), "append ai conversation message: missing conversation_id")
		return
	}

	var req model.AppendAIConversationMessageRequest
	if !utils.ExtractRequestBody(r, &req) {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "append ai conversation message: decode body")
		return
	}

	result, err := h.svc.AppendMessage(r.Context(), uid, conversationID, req)
	if err != nil {
		writeError(h.log, w, err, "append ai conversation message failed")
		return
	}

	type resp struct {
		Success bool                                       `json:"success"`
		Data    *model.AppendAIConversationMessageResponse `json:"data"`
	}

	writeJSON(h.log, w, http.StatusOK, resp{
		Success: true,
		Data:    result,
	})
}
