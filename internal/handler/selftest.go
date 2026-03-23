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

type SelfTestHandler struct {
	svc *service.SelfTestService
	log zerolog.Logger
}

func NewSelfTestHandler(svc *service.SelfTestService, log zerolog.Logger) *SelfTestHandler {
	return &SelfTestHandler{svc: svc, log: log}
}

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

// @Summary      Get self test result
// @Description  Fetches a self test result with detailed question results including user answers
// @Tags         SelfTests
// @Produce      json
// @Param        id  path  string  true  "Self Test ID"
// @Success      200  {object}  object{success=bool,data=model.SelfTestResultResponse}
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      404  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/self-tests/{id}/result [get]
func (h *SelfTestHandler) GetSelfTestResult(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "get self test result: missing user-id")
		return
	}

	selfTestID := chi.URLParam(r, "id")
	if selfTestID == "" {
		writeError(h.log, w, errs.NewBadRequestError("self_test_id is required", false, nil, nil, nil), "get self test result: missing id")
		return
	}

	result, err := h.svc.GetSelfTestResult(r.Context(), uid, selfTestID)
	if err != nil {
		writeError(h.log, w, err, "get self test result failed")
		return
	}

	type resp struct {
		Success bool                          `json:"success"`
		Data    *model.SelfTestResultResponse `json:"data"`
	}

	writeJSON(h.log, w, http.StatusOK, resp{
		Success: true,
		Data:    result,
	})
}
