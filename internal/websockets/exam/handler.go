package exam

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rs/zerolog"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// NOTE: tighten this check for production origin policy.
		return true
	},
}

// Handler provides HTTP endpoints for exam websocket operations.
type Handler struct {
	hub     *Hub
	examSvc *service.ExamService
	log     zerolog.Logger
}

// NewHandler creates a new websocket HTTP handler.
func NewHandler(hub *Hub, examSvc *service.ExamService, log zerolog.Logger) *Handler {
	return &Handler{
		hub:     hub,
		examSvc: examSvc,
		log:     log.With().Str("component", "ws_handler").Logger(),
	}
}

// ServeWS upgrades HTTP requests to websocket and registers the client to an exam room.
func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "exam_id")
	if examID == "" {
		h.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "exam_id is required"})
		return
	}

	userID, ok := r.Context().Value("user-id").(string)
	if !ok || userID == "" {
		h.writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	role := r.URL.Query().Get("role")
	if role == "" {
		role = RoleParticipant
	}
	if role != RoleParticipant && role != RoleController {
		h.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid role"})
		return
	}

	userName := r.URL.Query().Get("name")
	userImageURL := r.URL.Query().Get("image_url")

	examData, err := h.examSvc.GetExamByID(r.Context(), examID)
	if err != nil {
		h.log.Warn().Err(err).Str("exam_id", examID).Msg("failed to load exam for websocket")
		h.writeJSON(w, http.StatusNotFound, map[string]string{"error": "exam not found"})
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.log.Warn().Err(err).Msg("failed to upgrade websocket")
		return
	}

	room := h.hub.GetOrCreateRoom(&examData)
	if room == nil {
		_ = conn.Close()
		h.writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "websocket hub unavailable"})
		return
	}

	client := NewClient(
		room,
		conn,
		userID,
		examID,
		role,
		userName,
		userImageURL,
		h.log,
	)

	room.Register(client)

	go client.WritePump()
	go client.ReadPump()

	h.log.Info().
		Str("exam_id", examID).
		Str("user_id", userID).
		Str("role", role).
		Msg("websocket client connected")
}

// HandleStats returns hub stats as JSON.
func (h *Handler) HandleStats(w http.ResponseWriter, r *http.Request) {
	includeRooms := false
	if raw := r.URL.Query().Get("include_rooms"); raw != "" {
		parsed, err := strconv.ParseBool(raw)
		if err != nil {
			h.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid include_rooms value"})
			return
		}
		includeRooms = parsed
	}

	stats := h.hub.GetStats(includeRooms)
	h.writeJSON(w, http.StatusOK, stats)
}

func (h *Handler) writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		h.log.Warn().Err(err).Msg("failed to encode JSON response")
	}
}
