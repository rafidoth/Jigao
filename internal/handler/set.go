package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/service"
)

type SetHandler struct {
	svc *service.QuestionService
}

func NewSetHandler(svc *service.QuestionService) *SetHandler {
	return &SetHandler{svc: svc}
}

// CreateNewSet handles POST /sets/ — creates a new empty set.
//
// @Summary      Create a new set
// @Description  Creates a new empty question set owned by the authenticated user
// @Tags         Sets
// @Produce      json
// @Success      200  {object}  model.Set
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/sets/ [post]
func (h *SetHandler) CreateNewSet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "create set: missing user-id")
		return
	}

	set, err := h.svc.CreateNewSet(r.Context(), uid)
	if err != nil {
		writeError(w, err, "create new set failed")
		return
	}

	writeJSON(w, http.StatusOK, set)
}

// GetASet handles GET /sets/{set_id} — returns a set with its context.
//
// @Summary      Get a set by ID
// @Description  Returns a set with its visibility, title, and context content
// @Tags         Sets
// @Produce      json
// @Param        set_id  path      string  true  "Set ID"
// @Success      200     {object}  object{id=string,visibility=string,title=string,context=string}
// @Failure      400     {object}  errs.HTTPError
// @Failure      401     {object}  errs.HTTPError
// @Failure      500     {object}  errs.HTTPError
// @Router       /api/v1/sets/{set_id} [get]
func (h *SetHandler) GetASet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "get set: missing user-id")
		return
	}

	setID := chi.URLParam(r, "set_id")

	set, setCtx, err := h.svc.GetSetWithContext(r.Context(), uid, setID)
	if err != nil {
		writeError(w, err, "get set failed")
		return
	}

	type resp struct {
		ID         string `json:"id"`
		Visibility string `json:"visibility"`
		Title      string `json:"title"`
		Context    string `json:"context"`
	}

	writeJSON(w, http.StatusOK, resp{
		ID:         set.ID,
		Visibility: set.Visibility,
		Title:      set.Title,
		Context:    setCtx,
	})
}

// UpdateASet handles PUT /sets/{set_id} — updates a set's visibility and title.
//
// @Summary      Update a set
// @Description  Updates the visibility and title of an existing set
// @Tags         Sets
// @Accept       json
// @Param        set_id  path  string                                      true  "Set ID"
// @Param        body    body  object{visibility=string,title=string}      true  "Set update payload"
// @Success      200
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/sets/{set_id} [put]
func (h *SetHandler) UpdateASet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "update set: missing user-id")
		return
	}
	setID := chi.URLParam(r, "set_id")

	type reqBody struct {
		Visibility string `json:"visibility"`
		Title      string `json:"title"`
	}

	var req reqBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "update set: decode body")
		return
	}

	if _, err := h.svc.UpdateSet(r.Context(), uid, setID, req.Visibility, req.Title); err != nil {
		writeError(w, err, "update set failed")
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteASet handles DELETE /sets/{set_id} — deletes a set and its context.
//
// @Summary      Delete a set
// @Description  Deletes a set and its associated context content
// @Tags         Sets
// @Produce      json
// @Param        set_id  path      string  true  "Set ID"
// @Success      200     {object}  object{id=string,title=string}
// @Failure      400     {object}  errs.HTTPError
// @Failure      401     {object}  errs.HTTPError
// @Failure      500     {object}  errs.HTTPError
// @Router       /api/v1/sets/{set_id} [delete]
func (h *SetHandler) DeleteASet(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "delete set: missing user-id")
		return
	}
	setID := chi.URLParam(r, "set_id")

	deleted, err := h.svc.DeleteSetWithContext(r.Context(), uid, setID)
	if err != nil {
		writeError(w, err, "delete set failed")
		return
	}

	type resp struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	}
	writeJSON(w, http.StatusOK, resp{ID: setID, Title: deleted.Title})
}

// GetRecentSets handles GET /sets/?recent=N — returns recent sets with owner info.
//
// @Summary      Get recent sets
// @Description  Returns the N most recent sets with their owner information
// @Tags         Sets
// @Produce      json
// @Param        recent  query     int  true  "Number of recent sets to return"
// @Success      200     {array}   service.SetWithOwner
// @Failure      400     {object}  errs.HTTPError
// @Failure      401     {object}  errs.HTTPError
// @Failure      500     {object}  errs.HTTPError
// @Router       /api/v1/sets/ [get]
func (h *SetHandler) GetRecentSets(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "get recent sets: missing user-id")
		return
	}
	limitStr := r.URL.Query().Get("recent")
	if limitStr == "" {
		writeError(w, errs.NewBadRequestError("'recent' query parameter is required", false, nil, nil, nil), "get recent sets: missing limit")
		return
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		writeError(w, errs.NewBadRequestError("'recent' must be an integer", false, nil, nil, nil), "get recent sets: invalid limit")
		return
	}

	results, err := h.svc.GetRecentSetsWithOwners(r.Context(), uid, limit)
	if err != nil {
		writeError(w, err, "get recent sets failed")
		return
	}

	writeJSON(w, http.StatusOK, results)
}

// GetSetAccessList handles GET /sets/access_list/{set_id} — returns owner + shared users.
//
// @Summary      Get set access list
// @Description  Returns the list of users (owner + shared) who have access to a set
// @Tags         Sets
// @Produce      json
// @Param        set_id  path      string  true  "Set ID"
// @Success      200     {array}   users.User
// @Failure      400     {object}  errs.HTTPError
// @Failure      401     {object}  errs.HTTPError
// @Failure      500     {object}  errs.HTTPError
// @Router       /api/v1/sets/access_list/{set_id} [get]
func (h *SetHandler) GetSetAccessList(w http.ResponseWriter, r *http.Request) {
	setID := chi.URLParam(r, "set_id")
	if setID == "" {
		writeError(w, errs.NewBadRequestError("set_id is required", false, nil, nil, nil), "get access list: missing set_id")
		return
	}

	userList, err := h.svc.GetSetAccessList(r.Context(), setID)
	if err != nil {
		writeError(w, err, "get access list failed")
		return
	}

	writeJSON(w, http.StatusOK, userList)
}

// AllowSetAccess handles POST /sets/access — grants a user shared access to a set.
//
// @Summary      Grant set access
// @Description  Grants a user shared access to a set
// @Tags         Sets
// @Accept       json
// @Param        body  body  object{user_id=string,set_id=string}  true  "Access grant payload"
// @Success      200
// @Failure      400  {object}  errs.HTTPError
// @Failure      401  {object}  errs.HTTPError
// @Failure      500  {object}  errs.HTTPError
// @Router       /api/v1/sets/access [post]
func (h *SetHandler) AllowSetAccess(w http.ResponseWriter, r *http.Request) {
	type reqBody struct {
		UserID string `json:"user_id"`
		SetID  string `json:"set_id"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, errs.NewBadRequestError("Failed to read request body", false, nil, nil, nil), "allow access: read body")
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "allow access: unmarshal body")
		return
	}

	if err := h.svc.AllowSetAccess(r.Context(), req.SetID, req.UserID); err != nil {
		writeError(w, err, "allow set access failed")
		return
	}

	w.WriteHeader(http.StatusOK)
}
