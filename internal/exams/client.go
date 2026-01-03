package exams

import (
	"encoding/json"
	"fmt"
	"log"
	"log/slog"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn       *websocket.Conn
	Evt        chan *Event
	ClientType string // monitor, participant
	UserId     string `json:"id"`
	RoomId     string `json:"roomId"`
}

func NewClient(conn *websocket.Conn, clientType, id, roomId string) *Client {
	if clientType != "monitor" && clientType != "participant" {
		log.Println("invalid client type:", clientType)
		return nil
	}
	return &Client{
		Conn:       conn,
		Evt:        make(chan *Event, 10),
		ClientType: clientType,
		UserId:     id,
		RoomId:     roomId,
	}
}

func (cl *Client) DirectSend(jsnObj any) {
	cl.Conn.WriteJSON(jsnObj)
}

func (c *Client) Write() {
	defer func() {
		c.Conn.Close()
	}()

	fmt.Println("Starting write goroutine for client id:", c.UserId, "in room:", c.RoomId)
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

type ReceiveEvent struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type AnswerSelectPayload struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
}

func (c *Client) Read(eh *ExamHub) {
	defer func() {
		eh.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, m, err := c.Conn.ReadMessage()
		if err != nil {
			slog.Error("error reading message", "error", err)
			break
		}

		var re ReceiveEvent
		if err := json.Unmarshal(m, &re); err != nil {
			slog.Error("invalid event format", "error", err)
			continue
		}

		switch re.Type {
		case "answer_selected":
			// not using this event type for now
			var payload AnswerSelectPayload
			if err := json.Unmarshal(re.Payload, &payload); err != nil {
				slog.Error("invalid payload for answer_selected", "error", err)
				continue
			}

			fmt.Printf("User %s answered Question %s with %s\n", c.UserId, payload.QuestionID, payload.Answer)

			ase := &AnswerSelectEvent{
				ExamId:     c.RoomId,
				UserId:     c.UserId,
				QuestionId: payload.QuestionID,
				Answer:     payload.Answer,
			}
			fmt.Println("before sending in channel ", ase)
			eh.AnswerSelect <- ase

		case "submit_exam":
			var payload SubmitExamEvent
			if err := json.Unmarshal(re.Payload, &payload); err != nil {
				slog.Error("invalid payload for submit_exam", "error", err)
				continue
			}

			fmt.Printf("User %s submitted exam %s with answers %v\n", c.UserId, payload.ExamId, payload.Answers)
			see := &SubmitExamEvent{
				ExamId:  payload.ExamId,
				UserId:  c.UserId,
				Answers: payload.Answers,
			}
			eh.SubmitExam <- see
		}
	}
}
