package examWs

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rs/zerolog"
)

// Room represents a single exam session with connected clients
type Room struct {
	manager *Manager
	examID  string
	exam    *model.Exam

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
func NewRoom(manager *Manager, exam *model.Exam, log zerolog.Logger) *Room {
	ctx, cancel := context.WithCancel(context.Background())

	// Determine initial state based on exam's session status
	initialState := RoomStateWaiting
	if exam.SessionStatus == "live" {
		initialState = RoomStateLive
	} else if exam.SessionStatus == "finished" {
		initialState = RoomStateFinished
	}

	r := &Room{
		manager:      manager,
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

// StartExam transitions the exam from waiting to live state
func (r *Room) StartExam() {
	r.mu.Lock()
	if r.state != RoomStateWaiting {
		r.mu.Unlock()
		r.log.Debug().Str("state", r.state).Msg("cannot start exam, not in waiting state")
		return
	}

	r.state = RoomStateLive
	r.startedAt = time.Now()
	r.endsAt = r.startedAt.Add(time.Duration(r.exam.DurationInMinutes) * time.Minute)
	r.mu.Unlock()

	// Cancel start timer if exists
	if r.startTimer != nil {
		r.startTimer.Stop()
		r.startTimer = nil
	}

	// Setup end timer
	r.endTimer = time.AfterFunc(time.Until(r.endsAt), r.EndExam)

	r.log.Info().
		Time("started_at", r.startedAt).
		Time("ends_at", r.endsAt).
		Int("duration_minutes", r.exam.DurationInMinutes).
		Msg("exam started")

	// NOTE: In production, update exam status in database
	// Example: r.examService.StartExam(r.examID)

	// Broadcast to all connected clients
	r.BroadcastToAll(NewExamStartsMessage(r.endsAt.Format(time.RFC3339)))
}

// EndExam transitions the exam from live to finished state
func (r *Room) EndExam() {
	r.mu.Lock()
	if r.state == RoomStateFinished {
		r.mu.Unlock()
		r.log.Debug().Msg("exam already finished")
		return
	}

	r.state = RoomStateFinished
	r.mu.Unlock()

	// Cancel end timer if exists (manual end)
	if r.endTimer != nil {
		r.endTimer.Stop()
		r.endTimer = nil
	}

	r.log.Info().Time("ended_at", time.Now()).Msg("exam ended")

	// NOTE: In production, update exam status and finalize submissions
	// Example: r.examService.EndExam(r.examID)

	// Broadcast to all connected clients
	r.BroadcastToAll(NewExamEndsMessage(r.endsAt.Format(time.RFC3339)))
}

// BroadcastToAll sends a message to all connected clients (controllers and participants)
func (r *Room) BroadcastToAll(msg Message) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.controllers {
		c.SendMessage(msg)
	}
	for _, c := range r.participants {
		c.SendMessage(msg)
	}
}

// BroadcastToParticipants sends a message to all connected participants
func (r *Room) BroadcastToParticipants(msg Message) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.participants {
		c.SendMessage(msg)
	}
}

// Shutdown gracefully shuts down the room
func (r *Room) Shutdown() {
	r.log.Info().Msg("shutting down room")

	// Stop timers
	r.stopTimers()

	// Notify all clients
	r.BroadcastToAll(NewServerShutdownMessage())

	// Close all client connections
	r.mu.Lock()
	for _, c := range r.controllers {
		c.Close()
	}
	for _, c := range r.participants {
		c.Close()
	}
	r.mu.Unlock()

	// Signal done
	close(r.done)
	r.cancel()
}

// GetState returns the current room state
func (r *Room) GetState() string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.state
}

// GetExamID returns the exam ID for this room
func (r *Room) GetExamID() string {
	return r.examID
}

// IsEmpty returns true if no clients are connected
func (r *Room) IsEmpty() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.controllers) == 0 && len(r.participants) == 0
}

// ClientCount returns the total number of connected clients
func (r *Room) ClientCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.controllers) + len(r.participants)
}

// GetClient retrieves a client by userID from either controllers or participants
func (r *Room) GetClient(userID string) (*Client, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if c, exists := r.controllers[userID]; exists {
		return c, true
	}
	if c, exists := r.participants[userID]; exists {
		return c, true
	}
	return nil, false
}

// IsDone returns true if the room has been shut down
func (r *Room) IsDone() bool {
	select {
	case <-r.done:
		return true
	default:
		return false
	}
}

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

	// Controller actions
	case MsgTypeStartExam:
		r.handleStartExam(c)

	case MsgTypeEndExam:
		r.handleEndExam(c)

	case MsgTypeWarnParticipant:
		var payload WarnParticipantPayload
		if err := json.Unmarshal(raw.Payload, &payload); err != nil {
			c.SendError("invalid warn_participant payload", "INVALID_PAYLOAD")
			return
		}
		r.handleWarnParticipant(c, payload)

	case MsgTypeKickParticipant:
		var payload KickParticipantPayload
		if err := json.Unmarshal(raw.Payload, &payload); err != nil {
			c.SendError("invalid kick_participant payload", "INVALID_PAYLOAD")
			return
		}
		r.handleKickParticipant(c, payload)

	default:
		c.SendError("unknown message type: "+raw.Type, "UNKNOWN_TYPE")
	}
}

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
			"image_base64": payload.ImageBase64,
		},
	})
}

// handleStartExam processes manual exam start from controller (lobby mode)
func (r *Room) handleStartExam(c *Client) {
	// Only controllers can start exam
	if !c.IsController() {
		c.SendError("unauthorized: only controllers can start exam", "UNAUTHORIZED")
		return
	}

	// Check exam is in waiting state
	r.mu.RLock()
	state := r.state
	r.mu.RUnlock()

	if state != RoomStateWaiting {
		c.SendError("exam is not in waiting state", "INVALID_STATE")
		return
	}

	// Check start mode allows manual start
	if r.exam.StartMode != "lobby" {
		c.SendError("exam is in timed mode, cannot manually start", "INVALID_START_MODE")
		return
	}

	r.log.Info().
		Str("controller_id", c.UserID).
		Msg("exam manually started by controller")

	// Trigger exam start
	r.StartExam()
}

// handleEndExam processes manual exam end from controller
func (r *Room) handleEndExam(c *Client) {
	// Only controllers can end exam
	if !c.IsController() {
		c.SendError("unauthorized: only controllers can end exam", "UNAUTHORIZED")
		return
	}

	// Check exam is live
	r.mu.RLock()
	state := r.state
	r.mu.RUnlock()

	if state != RoomStateLive {
		c.SendError("exam is not currently running", "INVALID_STATE")
		return
	}

	r.log.Info().
		Str("controller_id", c.UserID).
		Msg("exam manually ended by controller")

	// Trigger exam end
	r.EndExam()
}

// handleWarnParticipant sends a warning to a specific participant
func (r *Room) handleWarnParticipant(c *Client, payload WarnParticipantPayload) {
	// Only controllers can warn participants
	if !c.IsController() {
		c.SendError("unauthorized: only controllers can warn participants", "UNAUTHORIZED")
		return
	}

	// Validate payload
	if payload.UserID == "" {
		c.SendError("user_id is required", "INVALID_PAYLOAD")
		return
	}
	if payload.Message == "" {
		c.SendError("message is required", "INVALID_PAYLOAD")
		return
	}

	// Find the participant
	r.mu.RLock()
	participant, exists := r.participants[payload.UserID]
	r.mu.RUnlock()

	if !exists {
		c.SendError("participant not found", "PARTICIPANT_NOT_FOUND")
		return
	}

	r.log.Info().
		Str("controller_id", c.UserID).
		Str("participant_id", payload.UserID).
		Str("message", payload.Message).
		Msg("warning sent to participant")

	// NOTE: In production, record warning in database
	// Example: r.examService.RecordWarning(r.examID, payload.UserID, payload.Message, c.UserID)

	// Send warning to the participant
	participant.SendMessage(NewWarningMessage(payload.Message, c.UserID))
}

// handleKickParticipant removes a participant from the exam
func (r *Room) handleKickParticipant(c *Client, payload KickParticipantPayload) {
	// Only controllers can kick participants
	if !c.IsController() {
		c.SendError("unauthorized: only controllers can kick participants", "UNAUTHORIZED")
		return
	}

	// Validate payload
	if payload.UserID == "" {
		c.SendError("user_id is required", "INVALID_PAYLOAD")
		return
	}

	// Find the participant
	r.mu.Lock()
	participant, exists := r.participants[payload.UserID]
	if exists {
		delete(r.participants, payload.UserID)
	}
	r.mu.Unlock()

	if !exists {
		c.SendError("participant not found", "PARTICIPANT_NOT_FOUND")
		return
	}

	r.log.Warn().
		Str("controller_id", c.UserID).
		Str("participant_id", payload.UserID).
		Str("reason", payload.Reason).
		Msg("participant kicked from exam")

	// NOTE: In production, record kick in database and mark submission as disqualified
	// Example: r.examService.KickParticipant(r.examID, payload.UserID, payload.Reason, c.UserID)

	// Send kicked message to participant, then close their connection
	participant.SendMessage(NewKickedMessage(payload.Reason))
	participant.Close()

	// Notify other controllers
	r.BroadcastToControllers(Message{
		Type: "participant_kicked",
		Payload: map[string]interface{}{
			"user_id":   payload.UserID,
			"reason":    payload.Reason,
			"kicked_by": c.UserID,
		},
	})
}

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
	))
}

func (r *Room) notifyParticipantLeft(c *Client) {
	r.BroadcastToControllers(NewParticipantLeftMessage(
		c.UserID,
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
