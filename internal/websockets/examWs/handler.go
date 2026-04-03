package examWs

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/rafidoth/onlyexams/internal/service"
	"github.com/rs/zerolog"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO check hard later -_-
		return true
	},
}

type ExamWsHandler struct {
	manager *Manager
	examSvc *service.ExamService
	log     zerolog.Logger
}

func NewHandler(
	manager *Manager,
	examSvc *service.ExamService,
	log zerolog.Logger,
) *ExamWsHandler {
	return &ExamWsHandler{
		manager: manager,
		examSvc: examSvc,
		log:     log.With().Str("component", "ws_handler").Logger(),
	}
}

// ServeWS upgrades HTTP requests to websocket and registers the client to an exam room.
func (h *ExamWsHandler) ServeWS(w http.ResponseWriter, r *http.Request) {

	userID, ok := r.Context().Value("user-id").(string)
	if !ok || userID == "" {
		h.writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	examID := r.URL.Query().Get("exam_id")
	if examID == "" {
		h.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "exam_id is required"})
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

	fmt.Println(examData, conn)

	// room := h.manager.GetOrCreateRoom(&examData)
	// if room == nil {
	// 	_ = conn.Close()
	// 	h.writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "websocket manager unavailable"})
	// 	return
	// }
	//
	// client := NewClient(
	// 	room,
	// 	conn,
	// 	userID,
	// 	examID,
	// 	role,
	// 	userName,
	// 	userImageURL,
	// 	h.log,
	// )
	//
	// room.Register(client)
	//
	// go client.WritePump()
	// go client.ReadPump()
	//
	// h.log.Info().
	// 	Str("exam_id", examID).
	// 	Str("user_id", userID).
	// 	Str("role", role).
	// 	Msg("websocket client connected")
}

// HandleStats returns hub stats as JSON.
func (h *ExamWsHandler) HandleStats(w http.ResponseWriter, r *http.Request) {
	includeRooms := false
	if raw := r.URL.Query().Get("include_rooms"); raw != "" {
		parsed, err := strconv.ParseBool(raw)
		if err != nil {
			h.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid include_rooms value"})
			return
		}
		includeRooms = parsed
	}

	stats := h.manager.GetStats(includeRooms)
	h.writeJSON(w, http.StatusOK, stats)
}

func (h *ExamWsHandler) writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		h.log.Warn().Err(err).Msg("failed to encode JSON response")
	}
}
