package exams

import (
	"errors"
	"fmt"
	"log"
	"log/slog"
	"time"

	"github.com/rafidoth/onlyexams/internal/exams/models"
)

type HubStorage interface {
	GetExamByExamId(examId string) (models.Exam, error)
}

type Room struct {
	Id      string             `json:"id"`
	Name    string             `json:"name"`
	Clients map[string]*Client `json:"clients"`
}

func NewRoom(id, name string) *Room {
	return &Room{
		Id:      id,
		Clients: make(map[string]*Client),
	}
}

type ExamHub struct {
	Rooms      map[string]*Room
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Event
	Storage    HubStorage
}

func NewExamHub(st HubStorage) *ExamHub {
	return &ExamHub{
		Rooms:      make(map[string]*Room),
		Register:   make(chan *Client, 10),
		Unregister: make(chan *Client, 10),
		Broadcast:  make(chan *Event, 10),
		Storage:    st,
	}
}

func (eh *ExamHub) CreateNewRoom(roomId string) error {
	if _, ok := eh.Rooms[roomId]; !ok {
		eh.Rooms[roomId] = NewRoom(roomId, roomId)
		return nil
	}
	return errors.New("room already exists")
}

func (eh *ExamHub) GetRoom(roomId string) *Room {
	if r, ok := eh.Rooms[roomId]; ok {
		return r
	}
	return nil
}

func (eh *ExamHub) Run() {
	for {
		select {
		//client to be registered
		case cl := <-eh.Register:
			handleRegisterClient(eh, cl)
		//client to be unregistered
		case cl := <-eh.Unregister:
			handleUnregisterClient(eh, cl)
		//broadcast to all clients in a room
		case event := <-eh.Broadcast:
			handleBroadcastEvent(eh, event)
		}
	}
}

func handleBroadcastEvent(eh *ExamHub, event *Event) {
	fmt.Println("Broadcasting event to room:", event.RoomId)
	if r, exists := eh.Rooms[event.RoomId]; exists {
		for _, client := range r.Clients {
			select {
			case client.Evt <- event:
			default:
				close(client.Evt)
				delete(r.Clients, client.Id)
			}
		}
	}
}

func handleUnregisterClient(eh *ExamHub, cl *Client) {
	if _, exists := eh.Rooms[cl.RoomId]; exists {
		if _, ok := eh.Rooms[cl.RoomId].Clients[cl.Id]; ok {
			delete(eh.Rooms[cl.RoomId].Clients, cl.Id)
			close(cl.Evt)
			log.Println("client unregistered from room:",
				cl.RoomId,
				"client id:",
				cl.Id,
			)
			if len(eh.Rooms[cl.RoomId].Clients) == 0 {
				delete(eh.Rooms, cl.RoomId)
				log.Println("room deleted as no clients are left:", cl.RoomId)
			}
		}
	}

}

func handleRegisterClient(eh *ExamHub, cl *Client) {
	fmt.Println(
		"Registering client to room:",
		cl.RoomId,
		"client id:",
		cl.Id,
	)
	if _, exists := eh.Rooms[cl.RoomId]; exists {
		r := eh.Rooms[cl.RoomId]
		if _, exists := r.Clients[cl.Id]; !exists {
			c := eh.Rooms[cl.RoomId].Clients
			c[cl.Id] = cl

			log.Println("client registered to room:",
				cl.RoomId,
				"client id:",
				cl.Id)

			writeOnJoinEvent(cl, eh)

		} else {
			log.Println("client already exists in room.")
		}
	} else {
		log.Println("room does not exist:", cl.RoomId)
	}
}

func writeOnJoinEvent(c *Client, eh *ExamHub) {
	exam, err := eh.Storage.GetExamByExamId(c.RoomId)
	if err != nil {
		slog.Info("error fetching exam for on-join event:", "error", err)
		return
	}
	slog.Info("Fetched exam for on-join event:", "examId", exam.Id)
	examStatus := getExamStatus(exam.StartTime, exam.EndTime)
	onJoinEvt := &OnJoinEvent{
		EventType:  "on-join-room",
		RoomId:     c.RoomId,
		ExamStatus: examStatus,
		StartTime:  exam.StartTime,
	}
	c.Conn.WriteJSON(onJoinEvt)
}

func getExamStatus(startTime, endTime time.Time) string {
	now := time.Now()

	switch {
	case now.Before(startTime):
		return "waiting"

	case now.After(endTime):
		return "ended"

	default:
		return "running"
	}
}
