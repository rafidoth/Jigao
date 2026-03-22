package handler

import (
	"net/http"

	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rafidoth/onlyexams/internal/utils"
	"github.com/rs/zerolog"
)

type SelfTestHandler struct {
	svc *service.SelfTestService
	log zerolog.Logger
}

func NewSelfTestHandler(svc *service.SelfTestService, log zerolog.Logger) *SelfTestHandler {
	return &SelfTestHandler{svc: svc, log: log}
}

// SubmitSelfTest handles POST /self-tests/submissions.
//
// @Summary      Submit a self test
// @Description  Saves a self test submission and returns computed score metadata
// @Tags         SelfTests
// @Accept       json
// @Produce      json
// @Param        body  body      model.SelfTestSubmissionRequest  true  "Self test submission payload"
// @Success      201   {object}  object{success=bool,message=string,data=model.SelfTestSubmissionResult}
// @Failure      400   {object}  errs.HTTPError
// @Failure      401   {object}  errs.HTTPError
// @Failure      403   {object}  errs.HTTPError
// @Failure      404   {object}  errs.HTTPError
// @Failure      500   {object}  errs.HTTPError
// @Router       /api/v1/self-tests/submissions [post]
func (h *SelfTestHandler) SubmitSelfTest(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "submit self test: missing user-id")
		return
	}

	var req model.SelfTestSubmissionRequest
	if !utils.ExtractRequestBody(r, &req) {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "submit self test: decode body")
		return
	}

	result, err := h.svc.SubmitSelfTest(r.Context(), uid, &req)
	if err != nil {
		writeError(h.log, w, err, "submit self test failed")
		return
	}

	type resp struct {
		Success bool                            `json:"success"`
		Message string                          `json:"message"`
		Data    *model.SelfTestSubmissionResult `json:"data"`
	}

	writeJSON(h.log, w, http.StatusCreated, resp{
		Success: true,
		Message: "Self test submitted",
		Data:    result,
	})
}
