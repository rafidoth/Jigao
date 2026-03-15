package handler

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
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
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
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
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	var req reqBody
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if err := h.svc.CreateExam(
		r.Context(), uid, req.SetID, req.Title, req.Description,
		req.StartTime, req.DurationInMinutes,
	); err != nil {
		// Check if validation error by unwrapping.
		var validationErr string
		if errors.Unwrap(err) != nil {
			validationErr = errors.Unwrap(err).Error()
		}
		// The service wraps validation errors with "validation: <msg>".
		if len(err.Error()) > 12 && err.Error()[:11] == "validation:" {
			http.Error(w, validationErr, http.StatusBadRequest)
			return
		}
		slog.Error("create exam failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// GetExams handles GET /exams/?set_id= — returns exams filtered by set_id or user.
func (h *ExamHandler) GetExams(w http.ResponseWriter, r *http.Request) {
	uid, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	setID := r.URL.Query().Get("set_id")
	examsList, err := h.svc.GetExams(r.Context(), uid, setID)
	if err != nil {
		slog.Error("get exams failed", "error", err)
		w.WriteHeader(http.StatusOK)
		return
	}

	writeJSON(w, http.StatusOK, examsList)
}

// GetExamByID handles GET /exams/{exam_id} — returns a single exam.
func (h *ExamHandler) GetExamByID(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	exam, err := h.svc.GetExamByID(r.Context(), examID)
	if err != nil {
		slog.Error("get exam by id failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, exam)
}

// RemoveExam handles DELETE /exams/{exam_id} — deletes an exam.
func (h *ExamHandler) RemoveExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	if err := h.svc.RemoveExam(r.Context(), examID); err != nil {
		if err.Error() == "remove exam: exam not found" {
			http.Error(w, "Exam not found", http.StatusNotFound)
			return
		}
		slog.Error("remove exam failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetQuestionsOfExam handles GET /exams/q/{exam_id} — returns all questions for an exam.
func (h *ExamHandler) GetQuestionsOfExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		http.Error(w, "exam_id is required", http.StatusBadRequest)
		return
	}

	questions, err := h.svc.GetQuestionsOfExam(r.Context(), examID)
	if err != nil {
		slog.Warn("get questions of exam failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, questions)
}

// JoinRoom handles GET /exams/join/{room_id} — upgrades to WebSocket for exam room.
func (h *ExamHandler) JoinRoom(w http.ResponseWriter, r *http.Request) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok || uid == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("websocket upgrade failed", "error", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
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
