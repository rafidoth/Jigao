package exam

import (
	"encoding/json"
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

// =============================================================================
// Read Pump
// =============================================================================

// ReadPump pumps messages from the WebSocket connection to the room.
// This runs in a dedicated goroutine for each client.
// The application ensures there is at most one reader on a connection by
// executing all reads from this goroutine.
func (c *Client) ReadPump() {
	defer func() {
		c.room.Unregister(c)
		c.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	if err := c.conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		c.log.Error().Err(err).Msg("failed to set read deadline")
		return
	}

	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.log.Warn().Err(err).Msg("websocket unexpected close")
			}
			break
		}

		// Parse the raw message to get type
		var raw RawMessage
		if err := json.Unmarshal(messageBytes, &raw); err != nil {
			c.log.Warn().Err(err).Msg("failed to parse message")
			c.SendError("invalid message format", "INVALID_FORMAT")
			continue
		}

		// Route message to room for handling
		c.room.HandleMessage(c, raw)
	}
}

// Close is a placeholder - full implementation in next commit
func (c *Client) Close() {}

// SendError is a placeholder - full implementation in next commit
func (c *Client) SendError(message, code string) {}
