package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rs/zerolog"
)

type SetHandler struct {
	svc *service.QuestionService
	log zerolog.Logger
}

func NewSetHandler(svc *service.QuestionService, log zerolog.Logger) *SetHandler {
	return &SetHandler{svc: svc, log: log}
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
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "create set: missing user-id")
		return
	}

	set, err := h.svc.CreateNewSet(r.Context(), uid)
	if err != nil {
		writeError(h.log, w, err, "create new set failed")
		return
	}

	writeJSON(h.log, w, http.StatusOK, set)
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
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "get set: missing user-id")
		return
	}

	setID := chi.URLParam(r, "set_id")

	set, setCtx, err := h.svc.GetSetWithContext(r.Context(), uid, setID)
	if err != nil {
		writeError(h.log, w, err, "get set failed")
		return
	}

	type resp struct {
		ID         string `json:"id"`
		Visibility string `json:"visibility"`
		Title      string `json:"title"`
		Context    string `json:"context"`
	}

	writeJSON(h.log, w, http.StatusOK, resp{
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
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "update set: missing user-id")
		return
	}
	setID := chi.URLParam(r, "set_id")

	type reqBody struct {
		Visibility string `json:"visibility"`
		Title      string `json:"title"`
	}

	var req reqBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "update set: decode body")
		return
	}

	if _, err := h.svc.UpdateSet(r.Context(), uid, setID, req.Visibility, req.Title); err != nil {
		writeError(h.log, w, err, "update set failed")
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
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "delete set: missing user-id")
		return
	}
	setID := chi.URLParam(r, "set_id")

	deleted, err := h.svc.DeleteSet(r.Context(), uid, setID)
	if err != nil {
		writeError(h.log, w, err, "delete set failed")
		return
	}

	type resp struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	}
	writeJSON(h.log, w, http.StatusOK, resp{ID: setID, Title: deleted.Title})
}

// GetSetList handles GET /sets/? — returns sets with filtering and cursor pagination.
//
// @Summary      Get sets
// @Description  Returns accessible sets (owned + shared) with optional filtering and pagination
// @Tags         Sets
// @Produce      json
// @Param        created_by   query     string  false  "Filter by creator user ID"
// @Param        visibility   query     string  false  "Filter by visibility: private|restricted|public"
// @Param        last_seen_id query    string  false  "Cursor: ID of last seen set"
// @Success     200       {object}  object{sets=[]service.SetWithOwner,next_last_seen_id=string|null}
// @Failure     400       {object}  errs.HTTPError
// @Failure     401       {object}  errs.HTTPError
// @Failure     500       {object}  errs.HTTPError
// @Router      /api/v1/sets/ [get]
func (h *SetHandler) GetSetList(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(h.log, w, errs.NewUnauthorizedError("Unauthorized", false), "get sets: missing user-id")
		return
	}
	query := r.URL.Query()

	createdBy := strings.TrimSpace(query.Get("created_by"))
	visibility := strings.TrimSpace(query.Get("visibility"))

	if visibility != "" && visibility != "private" && visibility != "restricted" && visibility != "public" {
		writeError(h.log, w, errs.NewBadRequestError("'visibility' must be one of: private, restricted, public", false, nil, nil, nil), "get sets: invalid visibility")
		return
	}

	lastSeenID := strings.TrimSpace(query.Get("last_seen_id"))

	results, nextLastSeenID, err := h.svc.ListSetsWithOwnersCursor(r.Context(), uid, createdBy, visibility, lastSeenID)
	if err != nil {
		writeError(h.log, w, err, "get sets failed")
		return
	}

	type resp struct {
		Sets           []service.SetWithOwner `json:"sets"`
		NextLastSeenID *string                `json:"next_last_seen_id"`
	}
	writeJSON(h.log, w, http.StatusOK, resp{
		Sets:           results,
		NextLastSeenID: nextLastSeenID,
	})
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
		writeError(h.log, w, errs.NewBadRequestError("set_id is required", false, nil, nil, nil), "get access list: missing set_id")
		return
	}

	userList, err := h.svc.GetSetAccessList(r.Context(), setID)
	if err != nil {
		writeError(h.log, w, err, "get access list failed")
		return
	}

	writeJSON(h.log, w, http.StatusOK, userList)
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
		writeError(h.log, w, errs.NewBadRequestError("Failed to read request body", false, nil, nil, nil), "allow access: read body")
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(h.log, w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "allow access: unmarshal body")
		return
	}

	if err := h.svc.AllowSetAccess(r.Context(), req.SetID, req.UserID); err != nil {
		writeError(h.log, w, err, "allow set access failed")
		return
	}

	w.WriteHeader(http.StatusOK)
}
