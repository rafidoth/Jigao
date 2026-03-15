package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/rafidoth/onlyexams/internal/errs"
	"github.com/rafidoth/onlyexams/internal/exams"
	"github.com/rafidoth/onlyexams/internal/service"
)

// ExamHandler handles exam-related HTTP requests.
type ExamHandler struct {
	svc *service.ExamService
}

// NewExamHandler creates a new ExamHandler.
func NewExamHandler(svc *service.ExamService) *ExamHandler {
	return &ExamHandler{svc: svc}
}

// WebSocket upgrader for exam rooms.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: restrict origins in production
	},
}

// CreateExam handles POST /exams/ — validates and creates an exam.
func (h *ExamHandler) CreateExam(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "create exam: missing user-id")
		return
	}

	type reqBody struct {
		SetID             string    `json:"set_id"`
		Title             string    `json:"title"`
		Description       string    `json:"description"`
		StartTime         time.Time `json:"start_time"`
		DurationInMinutes int       `json:"duration_in_minutes"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, errs.NewBadRequestError("Failed to read request body", false, nil, nil, nil), "create exam: read body")
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, errs.NewBadRequestError("Invalid request body", false, nil, nil, nil), "create exam: unmarshal body")
		return
	}

	if err := h.svc.CreateExam(
		r.Context(), uid, req.SetID, req.Title, req.Description,
		req.StartTime, req.DurationInMinutes,
	); err != nil {
		writeError(w, err, "create exam failed")
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// GetExams handles GET /exams/?set_id= — returns exams filtered by set_id or user.
func (h *ExamHandler) GetExams(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "get exams: missing user-id")
		return
	}

	setID := r.URL.Query().Get("set_id")
	examsList, err := h.svc.GetExams(r.Context(), uid, setID)
	if err != nil {
		writeError(w, err, "get exams failed")
		return
	}

	writeJSON(w, http.StatusOK, examsList)
}

// GetExamByID handles GET /exams/{exam_id} — returns a single exam.
func (h *ExamHandler) GetExamByID(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam: missing exam_id")
		return
	}

	exam, err := h.svc.GetExamByID(r.Context(), examID)
	if err != nil {
		writeError(w, err, "get exam by id failed")
		return
	}

	writeJSON(w, http.StatusOK, exam)
}

// RemoveExam handles DELETE /exams/{exam_id} — deletes an exam.
func (h *ExamHandler) RemoveExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "remove exam: missing exam_id")
		return
	}

	if err := h.svc.RemoveExam(r.Context(), examID); err != nil {
		writeError(w, err, "remove exam failed")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetQuestionsOfExam handles GET /exams/q/{exam_id} — returns all questions for an exam.
func (h *ExamHandler) GetQuestionsOfExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		writeError(w, errs.NewBadRequestError("exam_id is required", false, nil, nil, nil), "get exam questions: missing exam_id")
		return
	}

	questions, err := h.svc.GetQuestionsOfExam(r.Context(), examID)
	if err != nil {
		writeError(w, err, "get questions of exam failed")
		return
	}

	writeJSON(w, http.StatusOK, questions)
}

// JoinRoom handles GET /exams/join/{room_id} — upgrades to WebSocket for exam room.
func (h *ExamHandler) JoinRoom(w http.ResponseWriter, r *http.Request) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok || uid == "" {
		writeError(w, errs.NewUnauthorizedError("Unauthorized", false), "join room: missing user-id")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("websocket upgrade failed", "error", err)
		// Cannot use writeError here — the upgrade already wrote headers.
		return
	}

	roomID := chi.URLParam(r, "room_id")

	// Ensure room exists (creates if needed).
	if err := h.svc.EnsureRoomExists(r.Context(), roomID); err != nil {
		slog.Error("ensure room exists failed", "error", err)
		conn.Close()
		return
	}

	clientType := h.svc.DetermineClientType(r.Context(), uid, roomID)
	client := exams.NewClient(conn, clientType, uid, roomID)
	if client == nil {
		conn.Close()
		return
	}

	hub := h.svc.GetHub()
	hub.Register <- client
	go client.Write()
	go client.Read(hub)
}
