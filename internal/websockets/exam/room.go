package exam

import (
	"context"
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
func (r *Room) handleRegister(c *Client)                {}
func (r *Room) handleUnregister(c *Client)              {}
func (r *Room) HandleMessage(c *Client, raw RawMessage) {}
func (r *Room) StartExam()                              {}
func (r *Room) EndExam()                                {}

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
