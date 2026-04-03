package examWs

import (
	"context"
	"sync"
	"time"

	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rs/zerolog"
)

// Manager manages all exam rooms and coordinates client connections
type Manager struct {
	rooms           map[string]*Room
	mu              sync.RWMutex
	roomRequests    chan roomRequest
	done            chan struct{}
	ctx             context.Context
	cancel          context.CancelFunc
	cleanupInterval time.Duration
	log             zerolog.Logger
}

type roomRequest struct {
	exam   *model.Exam
	result chan *Room
}

func NewManager(log zerolog.Logger) *Manager {
	ctx, cancel := context.WithCancel(context.Background())

	return &Manager{
		rooms:           make(map[string]*Room),
		roomRequests:    make(chan roomRequest, 32),
		done:            make(chan struct{}),
		ctx:             ctx,
		cancel:          cancel,
		cleanupInterval: 5 * time.Minute,
		log:             log.With().Str("component", "manager").Logger(),
	}
}

func (h *Manager) Run() {
	h.log.Info().Msg("Exam Socket Manager started")

	cleanupTicker := time.NewTicker(h.cleanupInterval)
	defer cleanupTicker.Stop()

	defer func() {
		h.log.Info().Msg("Exam Socket Manager stopped")
	}()

	for {
		select {
		case <-h.ctx.Done():
			return

		case <-h.done:
			return

		case req := <-h.roomRequests:
			room := h.handleRoomRequest(req.exam)
			req.result <- room

		case <-cleanupTicker.C:
			h.cleanupEmptyRooms()
		}
	}
}

// GetOrCreateRoom returns an existing room or creates a new one for the exam
func (h *Manager) GetOrCreateRoom(exam *model.Exam) *Room {
	// First check if room already exists (fast path with read lock)
	h.mu.RLock()
	if room, exists := h.rooms[exam.Id]; exists {
		h.mu.RUnlock()
		return room
	}
	h.mu.RUnlock()

	// Room doesn't exist, request creation through the Run loop
	result := make(chan *Room, 1)
	select {
	case h.roomRequests <- roomRequest{exam: exam, result: result}:
		return <-result
	case <-h.done:
		return nil
	}
}

// handleRoomRequest creates or retrieves a room (called from Run loop)
func (h *Manager) handleRoomRequest(exam *model.Exam) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Double-check if room exists (another request may have created it)
	if room, exists := h.rooms[exam.Id]; exists {
		return room
	}

	// Create new room
	room := NewRoom(h, exam, h.log)
	h.rooms[exam.Id] = room

	// Start room's event loop
	go room.Run()

	h.log.Info().
		Str("exam_id", exam.Id).
		Str("title", exam.Title).
		Int("total_rooms", len(h.rooms)).
		Msg("room created")

	return room
}

// GetRoom returns an existing room by exam ID, or nil if not found
func (h *Manager) GetRoom(examID string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[examID]
}

// RemoveRoom removes a room from the hub (typically when exam is finished)
func (h *Manager) RemoveRoom(examID string) {
	h.mu.Lock()
	room, exists := h.rooms[examID]
	if exists {
		delete(h.rooms, examID)
	}
	h.mu.Unlock()

	if exists && room != nil {
		room.Shutdown()
		h.log.Info().
			Str("exam_id", examID).
			Int("remaining_rooms", len(h.rooms)).
			Msg("room removed")
	}
}

// cleanupEmptyRooms removes rooms with no connected clients and finished exams
func (h *Manager) cleanupEmptyRooms() {
	h.mu.Lock()
	defer h.mu.Unlock()

	var toRemove []string

	for examID, room := range h.rooms {
		// Remove if room is empty and exam is finished
		if room.IsEmpty() && room.GetState() == RoomStateFinished {
			toRemove = append(toRemove, examID)
		}
	}

	for _, examID := range toRemove {
		room := h.rooms[examID]
		delete(h.rooms, examID)
		room.Shutdown()

		h.log.Info().
			Str("exam_id", examID).
			Msg("empty room cleaned up")
	}

	if len(toRemove) > 0 {
		h.log.Info().
			Int("cleaned", len(toRemove)).
			Int("remaining", len(h.rooms)).
			Msg("cleanup completed")
	}
}

// RegisterClient registers a client with the appropriate room
// Returns the room the client was registered to, or nil if registration failed
func (h *Manager) RegisterClient(client *Client, exam *model.Exam) *Room {
	room := h.GetOrCreateRoom(exam)
	if room == nil {
		h.log.Error().Str("exam_id", exam.Id).Msg("failed to get/create room")
		return nil
	}

	room.Register(client)
	return room
}

// UnregisterClient unregisters a client from their room
func (h *Manager) UnregisterClient(client *Client) {
	if client.room != nil {
		client.room.Unregister(client)
	}
}

// RoomCount returns the number of active rooms
func (h *Manager) RoomCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms)
}

// ManagerStats contains statistics about the manager's current state
type ManagerStats struct {
	TotalRooms        int         `json:"total_rooms"`
	TotalClients      int         `json:"total_clients"`
	TotalControllers  int         `json:"total_controllers"`
	TotalParticipants int         `json:"total_participants"`
	RoomStats         []RoomStats `json:"rooms,omitempty"`
}

// RoomStats contains statistics about a single room
type RoomStats struct {
	ExamID       string `json:"exam_id"`
	ExamTitle    string `json:"exam_title"`
	State        string `json:"state"`
	Controllers  int    `json:"controllers"`
	Participants int    `json:"participants"`
}

// GetStats returns current statistics about the manager and its rooms
func (h *Manager) GetStats(includeRooms bool) ManagerStats {
	h.mu.RLock()
	defer h.mu.RUnlock()

	stats := ManagerStats{
		TotalRooms: len(h.rooms),
	}

	if includeRooms {
		stats.RoomStats = make([]RoomStats, 0, len(h.rooms))
	}

	for examID, room := range h.rooms {
		room.mu.RLock()
		controllerCount := len(room.controllers)
		participantCount := len(room.participants)
		state := room.state
		title := room.exam.Title
		room.mu.RUnlock()

		stats.TotalControllers += controllerCount
		stats.TotalParticipants += participantCount

		if includeRooms {
			stats.RoomStats = append(stats.RoomStats, RoomStats{
				ExamID:       examID,
				ExamTitle:    title,
				State:        state,
				Controllers:  controllerCount,
				Participants: participantCount,
			})
		}
	}

	stats.TotalClients = stats.TotalControllers + stats.TotalParticipants

	return stats
}

// Shutdown gracefully shuts down the hub and all rooms
func (h *Manager) Shutdown() {
	h.log.Info().Msg("shutting down manager")

	// Signal done to stop the Run loop
	close(h.done)
	h.cancel()

	// Shutdown all rooms
	h.mu.Lock()
	rooms := make([]*Room, 0, len(h.rooms))
	for _, room := range h.rooms {
		rooms = append(rooms, room)
	}
	h.rooms = make(map[string]*Room)
	h.mu.Unlock()

	// Shutdown rooms outside the lock
	for _, room := range rooms {
		room.Shutdown()
	}

	h.log.Info().Int("rooms_closed", len(rooms)).Msg("manager shutdown complete")
}

// IsDone returns true if the manager has been shut down
func (h *Manager) IsDone() bool {
	select {
	case <-h.done:
		return true
	default:
		return false
	}
}
