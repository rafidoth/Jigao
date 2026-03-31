package examWs

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
)

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

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if err := c.conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				c.log.Error().Err(err).Msg("failed to set write deadline")
				return
			}

			if !ok {
				// Channel closed, send close message
				if err := c.conn.WriteMessage(websocket.CloseMessage, []byte{}); err != nil {
					c.log.Debug().Err(err).Msg("failed to write close message")
				}
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				c.log.Warn().Err(err).Msg("failed to write message")
				return
			}

		case <-ticker.C:
			if err := c.conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				c.log.Error().Err(err).Msg("failed to set write deadline for ping")
				return
			}

			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.log.Debug().Err(err).Msg("failed to write ping")
				return
			}
		}
	}
}

func (c *Client) SendMessage(msg Message) error {
	c.mu.RLock()
	if c.closed {
		c.mu.RUnlock()
		return nil // Silently ignore sends to closed clients
	}
	c.mu.RUnlock()

	data, err := json.Marshal(msg)
	if err != nil {
		c.log.Error().Err(err).Interface("msg", msg).Msg("failed to marshal message")
		return err
	}

	// Non-blocking send with timeout
	select {
	case c.send <- data:
		return nil
	default:
		// Channel full, client is too slow
		c.log.Warn().Msg("send channel full, closing slow client")
		c.Close()
		return nil
	}
}

// sends an error message to this client
func (c *Client) SendError(message, code string) {
	if err := c.SendMessage(NewErrorMessage(message, code)); err != nil {
		c.log.Error().Err(err).Msg("failed to send error message")
	}
}

func (c *Client) SetCameraActive(active bool) {
	c.mu.Lock()
	c.CameraActive = active
	c.mu.Unlock()
}

// GetCameraActive returns the current camera state
func (c *Client) GetCameraActive() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.CameraActive
}

// IsController returns true if client has controller role
func (c *Client) IsController() bool {
	return c.Role == RoleController
}

// IsParticipant returns true if client has participant role
func (c *Client) IsParticipant() bool {
	return c.Role == RoleParticipant
}

func (c *Client) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.closed {
		return
	}

	c.closed = true
	c.IsOnline = false

	// Close the send channel to signal WritePump to exit
	close(c.send)

	// Close the WebSocket connection
	if err := c.conn.Close(); err != nil {
		c.log.Debug().Err(err).Msg("error closing websocket connection")
	}

	c.log.Debug().Msg("client closed")
}

// IsClosed returns true if client has been closed
func (c *Client) IsClosed() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.closed
}
