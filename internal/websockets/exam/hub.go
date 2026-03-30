package exam

import (
	"context"
	"sync"
	"time"

	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rs/zerolog"
)

// =============================================================================
// Hub
// =============================================================================

// Hub manages all exam rooms and coordinates client connections
type Hub struct {
	// Active rooms by exam ID
	rooms map[string]*Room
	mu    sync.RWMutex

	// Channels for room management
	roomRequests chan roomRequest

	// Lifecycle
	done   chan struct{}
	ctx    context.Context
	cancel context.CancelFunc

	// Configuration
	cleanupInterval time.Duration

	// Logging
	log zerolog.Logger
}

// roomRequest is used to safely create or get rooms from the Run goroutine
type roomRequest struct {
	exam   *model.Exam
	result chan *Room
}

// NewHub creates a new Hub instance
func NewHub(log zerolog.Logger) *Hub {
	ctx, cancel := context.WithCancel(context.Background())

	return &Hub{
		rooms:           make(map[string]*Room),
		roomRequests:    make(chan roomRequest, 32),
		done:            make(chan struct{}),
		ctx:             ctx,
		cancel:          cancel,
		cleanupInterval: 5 * time.Minute, // Cleanup empty rooms every 5 minutes
		log:             log.With().Str("component", "hub").Logger(),
	}
}

// =============================================================================
// Main Run Loop
// =============================================================================

// Run starts the hub's main event loop
// This should be called as a goroutine
func (h *Hub) Run() {
	h.log.Info().Msg("hub started")

	cleanupTicker := time.NewTicker(h.cleanupInterval)
	defer cleanupTicker.Stop()

	defer func() {
		h.log.Info().Msg("hub stopped")
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

// =============================================================================
// Room Management
// =============================================================================

// GetOrCreateRoom returns an existing room or creates a new one for the exam
// This is safe to call from any goroutine
func (h *Hub) GetOrCreateRoom(exam *model.Exam) *Room {
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
func (h *Hub) handleRoomRequest(exam *model.Exam) *Room {
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
func (h *Hub) GetRoom(examID string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[examID]
}

// RemoveRoom removes a room from the hub (typically when exam is finished)
func (h *Hub) RemoveRoom(examID string) {
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
func (h *Hub) cleanupEmptyRooms() {
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

// =============================================================================
// Client Management
// =============================================================================

// RegisterClient registers a client with the appropriate room
// Returns the room the client was registered to, or nil if registration failed
func (h *Hub) RegisterClient(client *Client, exam *model.Exam) *Room {
	room := h.GetOrCreateRoom(exam)
	if room == nil {
		h.log.Error().Str("exam_id", exam.Id).Msg("failed to get/create room")
		return nil
	}

	room.Register(client)
	return room
}

// UnregisterClient unregisters a client from their room
func (h *Hub) UnregisterClient(client *Client) {
	if client.room != nil {
		client.room.Unregister(client)
	}
}

// RoomCount returns the number of active rooms
func (h *Hub) RoomCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms)
}

// =============================================================================
// Statistics
// =============================================================================

// HubStats contains statistics about the hub's current state
type HubStats struct {
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

// GetStats returns current statistics about the hub and its rooms
func (h *Hub) GetStats(includeRooms bool) HubStats {
	h.mu.RLock()
	defer h.mu.RUnlock()

	stats := HubStats{
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

// =============================================================================
// Lifecycle
// =============================================================================

// Shutdown gracefully shuts down the hub and all rooms
func (h *Hub) Shutdown() {
	h.log.Info().Msg("shutting down hub")

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

	h.log.Info().Int("rooms_closed", len(rooms)).Msg("hub shutdown complete")
}

// IsDone returns true if the hub has been shut down
func (h *Hub) IsDone() bool {
	select {
	case <-h.done:
		return true
	default:
		return false
	}
}
