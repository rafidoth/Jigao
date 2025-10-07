package exams

import (
	"fmt"
	"log"
	"log/slog"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn       *websocket.Conn
	Evt        chan *Event
	ClientType string // controller, participant
	Id         string `json:"id"`
	RoomId     string `json:"roomId"`
}

func newClient(conn *websocket.Conn, clientType, id, roomId string) *Client {
	if clientType != "controller" && clientType != "participant" {
		log.Println("invalid client type:", clientType)
		return nil
	}
	return &Client{
		Conn:       conn,
		Evt:        make(chan *Event, 10),
		ClientType: clientType,
		Id:         id,
		RoomId:     roomId,
	}
}

func (c *Client) write() {
	defer func() {
		c.Conn.Close()
	}()
	fmt.Println("Client write routine started for client id:", c.Id, "in room:", c.RoomId)

	for {
		m, ok := <-c.Evt
		if !ok {
			slog.Warn("event channel closed")
			return
		}
		slog.Info("sending event to client", "event", m)
		c.Conn.WriteJSON(m)
	}
}

func (c *Client) read(eh *ExamHub) {
	defer func() {
		eh.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, m, err := c.Conn.ReadMessage()
		if err != nil {
			cga := websocket.CloseGoingAway
			cac := websocket.CloseAbnormalClosure
			if websocket.IsUnexpectedCloseError(err, cga, cac) {
				log.Printf("error: %v", err)
			}
			break
		}
		fmt.Println(
			"Received message from client id:",
			c.Id, "in room:",
			c.RoomId, "message:",
			string(m),
		)
		evt := newEvent(c.RoomId, c.Id, "message", string(m))
		eh.broadcast <- evt
	}

}
