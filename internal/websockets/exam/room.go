package exam

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rs/zerolog"
)

// =============================================================================
// Room
// =============================================================================

// Room represents a single exam session with connected clients
type Room struct {
	hub    *Hub
	examID string
	exam   *model.Exam

	// Connected clients by role
	controllers  map[string]*Client // userID → Client
	participants map[string]*Client // userID → Client
	mu           sync.RWMutex

	// Channels for client management
	register   chan *Client
	unregister chan *Client

	// Lifecycle
	done   chan struct{}
	ctx    context.Context
	cancel context.CancelFunc

	// Timers for auto-start and auto-end
	startTimer *time.Timer
	endTimer   *time.Timer

	// Current state
	state     string // waiting, live, finished
	startedAt time.Time
	endsAt    time.Time

	// Logging
	log zerolog.Logger
}

// NewRoom creates a new exam room
func NewRoom(hub *Hub, exam *model.Exam, log zerolog.Logger) *Room {
	ctx, cancel := context.WithCancel(context.Background())

	// Determine initial state based on exam's session status
	initialState := RoomStateWaiting
	if exam.SessionStatus == "live" {
		initialState = RoomStateLive
	} else if exam.SessionStatus == "finished" {
		initialState = RoomStateFinished
	}

	r := &Room{
		hub:          hub,
		examID:       exam.Id,
		exam:         exam,
		controllers:  make(map[string]*Client),
		participants: make(map[string]*Client),
		register:     make(chan *Client, 16),
		unregister:   make(chan *Client, 16),
		done:         make(chan struct{}),
		ctx:          ctx,
		cancel:       cancel,
		state:        initialState,
		endsAt:       exam.EndTime,
		log:          log.With().Str("exam_id", exam.Id).Str("component", "room").Logger(),
	}

	return r
}

// =============================================================================
// Main Run Loop
// =============================================================================

// Run starts the room's main event loop
// This should be called as a goroutine
func (r *Room) Run() {
	r.log.Info().Str("state", r.state).Msg("room started")

	// Setup timers based on exam configuration
	r.setupTimers()

	defer func() {
		r.stopTimers()
		r.log.Info().Msg("room stopped")
	}()

	for {
		select {
		case <-r.ctx.Done():
			return

		case <-r.done:
			return

		case client := <-r.register:
			r.handleRegister(client)

		case client := <-r.unregister:
			r.handleUnregister(client)
		}
	}
}

// =============================================================================
// Timer Management
// =============================================================================

func (r *Room) setupTimers() {
	now := time.Now()

	// Only setup timers if room is in waiting state
	if r.state != RoomStateWaiting {
		// If already live, just setup end timer
		if r.state == RoomStateLive && r.exam.EndTime.After(now) {
			r.endTimer = time.AfterFunc(time.Until(r.exam.EndTime), r.EndExam)
			r.log.Info().Time("ends_at", r.exam.EndTime).Msg("end timer set")
		}
		return
	}

	// For timed mode, setup auto-start
	if r.exam.StartMode == "timed" {
		if r.exam.StartTime.After(now) {
			// Exam hasn't started yet, schedule auto-start
			r.startTimer = time.AfterFunc(time.Until(r.exam.StartTime), r.StartExam)
			r.log.Info().Time("starts_at", r.exam.StartTime).Msg("start timer set (timed mode)")
		} else if r.exam.EndTime.After(now) {
			// Start time passed but end time hasn't, start immediately
			r.log.Info().Msg("start time passed, starting exam immediately")
			go r.StartExam()
		}
	}
	// For lobby mode, controller must manually start via start_exam message
}

func (r *Room) stopTimers() {
	if r.startTimer != nil {
		r.startTimer.Stop()
		r.startTimer = nil
	}
	if r.endTimer != nil {
		r.endTimer.Stop()
		r.endTimer = nil
	}
}

// Placeholder methods - will be implemented in next commits
func (r *Room) StartExam() {}
func (r *Room) EndExam()   {}

// =============================================================================
// Message Routing
// =============================================================================

// HandleMessage routes incoming messages to appropriate handlers based on type
func (r *Room) HandleMessage(c *Client, raw RawMessage) {
	switch raw.Type {
	// Participant actions
	case MsgTypeAnswerUpdate:
		var payload AnswerUpdatePayload
		if err := json.Unmarshal(raw.Payload, &payload); err != nil {
			c.SendError("invalid answer_update payload", "INVALID_PAYLOAD")
			return
		}
		r.handleAnswerUpdate(c, payload)

	case MsgTypeSubmitExam:
		var payload SubmitExamPayload
		if err := json.Unmarshal(raw.Payload, &payload); err != nil {
			c.SendError("invalid submit_exam payload", "INVALID_PAYLOAD")
			return
		}
		r.handleSubmitExam(c, payload)

	case MsgTypeViolationReport:
		var payload ViolationReportPayload
		if err := json.Unmarshal(raw.Payload, &payload); err != nil {
			c.SendError("invalid violation_report payload", "INVALID_PAYLOAD")
			return
		}
		r.handleViolationReport(c, payload)

	case MsgTypeCameraStatus:
		var payload CameraStatusPayload
		if err := json.Unmarshal(raw.Payload, &payload); err != nil {
			c.SendError("invalid camera_status payload", "INVALID_PAYLOAD")
			return
		}
		r.handleCameraStatus(c, payload)

	case MsgTypeCameraSnapshot:
		var payload CameraSnapshotPayload
		if err := json.Unmarshal(raw.Payload, &payload); err != nil {
			c.SendError("invalid camera_snapshot payload", "INVALID_PAYLOAD")
			return
		}
		r.handleCameraSnapshot(c, payload)

	// Controller actions - will be implemented in next commit
	case MsgTypeStartExam, MsgTypeEndExam, MsgTypeWarnParticipant, MsgTypeKickParticipant:
		if !c.IsController() {
			c.SendError("unauthorized: controller action", "UNAUTHORIZED")
			return
		}
		// TODO: Implement controller handlers in commit 12
		c.SendError("controller actions not yet implemented", "NOT_IMPLEMENTED")

	default:
		c.SendError("unknown message type: "+raw.Type, "UNKNOWN_TYPE")
	}
}

// =============================================================================
// Participant Message Handlers
// =============================================================================

// handleAnswerUpdate processes answer save from participant
func (r *Room) handleAnswerUpdate(c *Client, payload AnswerUpdatePayload) {
	// Only participants can submit answers
	if !c.IsParticipant() {
		c.SendError("only participants can submit answers", "UNAUTHORIZED")
		return
	}

	// Check exam is live
	r.mu.RLock()
	state := r.state
	r.mu.RUnlock()

	if state != RoomStateLive {
		c.SendError("exam is not currently running", "EXAM_NOT_LIVE")
		return
	}

	// Validate payload
	if payload.QuestionID == "" {
		c.SendError("question_id is required", "INVALID_PAYLOAD")
		return
	}

	r.log.Debug().
		Str("user_id", c.UserID).
		Str("question_id", payload.QuestionID).
		Msg("answer update received")

	// NOTE: In production, save to database/Redis here via service layer
	// Example: r.examService.SaveAnswer(r.examID, c.UserID, payload.QuestionID, payload.Answer)

	// Send ACK back to participant
	c.SendMessage(NewAnswerSavedMessage(payload.QuestionID))
}

// handleSubmitExam processes final exam submission from participant
func (r *Room) handleSubmitExam(c *Client, payload SubmitExamPayload) {
	// Only participants can submit exams
	if !c.IsParticipant() {
		c.SendError("only participants can submit exams", "UNAUTHORIZED")
		return
	}

	// Check exam is live
	r.mu.RLock()
	state := r.state
	r.mu.RUnlock()

	if state != RoomStateLive {
		c.SendError("exam is not currently running", "EXAM_NOT_LIVE")
		return
	}

	r.log.Info().
		Str("user_id", c.UserID).
		Int("answer_count", len(payload.Answers)).
		Msg("exam submitted")

	// NOTE: In production, process submission via service layer
	// Example: r.examService.SubmitExam(r.examID, c.UserID, payload.Answers)

	// Notify controllers about submission
	r.BroadcastToControllers(Message{
		Type: "participant_submitted",
		Payload: map[string]interface{}{
			"user_id": c.UserID,
			"name":    c.UserName,
		},
	})
}

// handleViolationReport processes violation detected by browser
func (r *Room) handleViolationReport(c *Client, payload ViolationReportPayload) {
	// Silently ignore if not a participant (don't leak info)
	if !c.IsParticipant() {
		return
	}

	// Check exam is live
	r.mu.RLock()
	state := r.state
	r.mu.RUnlock()

	if state != RoomStateLive {
		return // Ignore violations when exam not running
	}

	r.log.Warn().
		Str("user_id", c.UserID).
		Str("violation_type", payload.Type).
		Interface("details", payload.Details).
		Msg("violation reported")

	// NOTE: In production, record violation and get count from service
	// Example: count := r.examService.RecordViolation(r.examID, c.UserID, payload.Type, payload.Details)
	violationCount := 1 // Placeholder

	// Alert all controllers
	r.BroadcastToControllers(NewViolationAlertMessage(
		c.UserID,
		c.UserName,
		payload.Type,
		violationCount,
	))
}

// handleCameraStatus processes camera state change from participant
func (r *Room) handleCameraStatus(c *Client, payload CameraStatusPayload) {
	// Silently ignore if not a participant
	if !c.IsParticipant() {
		return
	}

	// Update client's camera state
	c.SetCameraActive(payload.Active)

	r.log.Debug().
		Str("user_id", c.UserID).
		Bool("camera_active", payload.Active).
		Msg("camera status updated")

	// Notify all controllers
	r.BroadcastToControllers(NewCameraUpdateMessage(
		c.UserID,
		c.UserName,
		payload.Active,
	))
}

// handleCameraSnapshot relays camera image to controllers
func (r *Room) handleCameraSnapshot(c *Client, payload CameraSnapshotPayload) {
	// Silently ignore if not a participant
	if !c.IsParticipant() {
		return
	}

	// Check exam is live
	r.mu.RLock()
	state := r.state
	r.mu.RUnlock()

	if state != RoomStateLive {
		return // Don't relay snapshots when exam not running
	}

	// Validate we have image data
	if payload.ImageBase64 == "" {
		return
	}

	// Relay snapshot to all controllers (for proctoring display)
	// We create a custom message since this is high-frequency and specific
	r.BroadcastToControllers(Message{
		Type: "camera_snapshot",
		Payload: map[string]interface{}{
			"user_id":      c.UserID,
			"name":         c.UserName,
			"image_base64": payload.ImageBase64,
		},
	})
}

// =============================================================================
// Client Registration
// =============================================================================

func (r *Room) handleRegister(c *Client) {
	r.mu.Lock()

	// Add to appropriate map based on role
	if c.IsController() {
		r.controllers[c.UserID] = c
		r.log.Info().Str("user_id", c.UserID).Msg("controller registered")
	} else {
		r.participants[c.UserID] = c
		r.log.Info().Str("user_id", c.UserID).Msg("participant registered")

		// Notify controllers about new participant
		r.mu.Unlock()
		r.notifyParticipantJoined(c)
		r.mu.Lock()
	}

	r.mu.Unlock()

	// Send initial state to the newly connected client
	r.sendInitialState(c)

	// If client is controller, also send full room state
	if c.IsController() {
		r.sendRoomState(c)
	}
}

func (r *Room) handleUnregister(c *Client) {
	r.mu.Lock()

	var removed bool
	if c.IsController() {
		if _, exists := r.controllers[c.UserID]; exists {
			delete(r.controllers, c.UserID)
			removed = true
			r.log.Info().Str("user_id", c.UserID).Msg("controller unregistered")
		}
	} else {
		if _, exists := r.participants[c.UserID]; exists {
			delete(r.participants, c.UserID)
			removed = true
			r.log.Info().Str("user_id", c.UserID).Msg("participant unregistered")
		}
	}

	r.mu.Unlock()

	if removed && c.IsParticipant() {
		r.notifyParticipantLeft(c)
	}
}

func (r *Room) sendInitialState(c *Client) {
	r.mu.RLock()
	state := r.state
	r.mu.RUnlock()

	var timeStr string
	switch state {
	case RoomStateWaiting:
		timeStr = r.exam.StartTime.Format(time.RFC3339)
	case RoomStateLive:
		timeStr = r.endsAt.Format(time.RFC3339)
	case RoomStateFinished:
		timeStr = r.endsAt.Format(time.RFC3339)
	}

	// Map internal state to frontend expected format
	frontendStatus := state
	if state == RoomStateLive {
		frontendStatus = "running"
	} else if state == RoomStateFinished {
		frontendStatus = "ended"
	}

	c.SendMessage(NewOnJoinRoomMessage(frontendStatus, timeStr, r.exam.Title, c.Role))
}

func (r *Room) sendRoomState(c *Client) {
	if !c.IsController() {
		return
	}

	snapshot := r.GetRoomStateSnapshot()
	c.SendMessage(NewRoomStateMessage(
		snapshot.ExamStatus,
		snapshot.StartTime,
		snapshot.EndTime,
		snapshot.Participants,
	))
}

// GetRoomStateSnapshot returns current state for room-state message
func (r *Room) GetRoomStateSnapshot() RoomStatePayload {
	r.mu.RLock()
	defer r.mu.RUnlock()

	participants := make([]ParticipantSnapshot, 0, len(r.participants))

	for userID, client := range r.participants {
		participants = append(participants, ParticipantSnapshot{
			UserID:         userID,
			Name:           client.UserName,
			ImageURL:       client.UserImageURL,
			Status:         "taking_exam", // TODO: Get from service
			CameraActive:   client.GetCameraActive(),
			ViolationCount: 0, // TODO: Get from service
			IsOnline:       !client.IsClosed(),
		})
	}

	return RoomStatePayload{
		ExamStatus:   r.state,
		StartTime:    r.exam.StartTime.Format(time.RFC3339),
		EndTime:      r.endsAt.Format(time.RFC3339),
		Participants: participants,
	}
}

func (r *Room) notifyParticipantJoined(c *Client) {
	r.BroadcastToControllers(NewParticipantJoinedMessage(
		c.UserID,
		c.UserName,
		c.UserImageURL,
	))
}

func (r *Room) notifyParticipantLeft(c *Client) {
	r.BroadcastToControllers(NewParticipantLeftMessage(
		c.UserID,
		c.UserName,
		c.UserImageURL,
	))
}

// BroadcastToControllers sends a message to all connected controllers
func (r *Room) BroadcastToControllers(msg Message) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.controllers {
		c.SendMessage(msg)
	}
}

// Register queues a client for registration
func (r *Room) Register(c *Client) {
	select {
	case r.register <- c:
	case <-r.done:
		c.Close()
	}
}

// Unregister queues a client for unregistration
func (r *Room) Unregister(c *Client) {
	select {
	case r.unregister <- c:
	case <-r.done:
	}
}
