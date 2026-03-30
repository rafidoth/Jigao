package exam

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
)

// =============================================================================
// Constants
// =============================================================================

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer (512KB for camera snapshots)
	maxMessageSize = 512 * 1024

	// Send channel buffer size
	sendBufferSize = 256
)

// =============================================================================
// Client
// =============================================================================

// Client represents a single WebSocket connection
type Client struct {
	room *Room
	conn *websocket.Conn
	send chan []byte

	// Identity
	UserID string
	ExamID string
	Role   string // "controller" or "participant"

	// User display info
	UserName     string
	UserImageURL string

	// State
	CameraActive bool
	IsOnline     bool

	// Synchronization
	mu     sync.RWMutex
	closed bool

	// Logging
	log zerolog.Logger
}

// NewClient creates a new WebSocket client
func NewClient(
	room *Room,
	conn *websocket.Conn,
	userID, examID, role string,
	userName, userImageURL string,
	log zerolog.Logger,
) *Client {
	return &Client{
		room:         room,
		conn:         conn,
		send:         make(chan []byte, sendBufferSize),
		UserID:       userID,
		ExamID:       examID,
		Role:         role,
		UserName:     userName,
		UserImageURL: userImageURL,
		CameraActive: false,
		IsOnline:     true,
		log:          log.With().Str("user_id", userID).Str("role", role).Logger(),
	}
}
