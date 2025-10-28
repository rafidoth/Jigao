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
	Id               string             `json:"id"`
	Clients          map[string]*Client `json:"clients"`
	StartSignalTimer *time.Timer        `json:"-"`
	EndSignalTimer   *time.Timer        `json:"-"`
	Exam             models.Exam        `json:"-"`
}

func makeStartTimer(xm models.Exam, eH *ExamHub) *time.Timer {
	var t *time.Timer
	duration := time.Until(xm.StartTime)
	t = time.AfterFunc(duration, func() {
		fmt.Println("Exam started for room:", xm.Id)
		payload := struct {
			EndTime time.Time `json:"end_time"`
		}{
			EndTime: xm.EndTime,
		}
		evt := makeEvent("exam-starts-now", xm.Id, payload)
		eH.Broadcast <- evt
	})
	slog.Info("room timer set for exam start", "duration", duration)
	return t
}

func makeEndTimer(xm models.Exam, eH *ExamHub) *time.Timer {
	var t *time.Timer
	duration := time.Until(xm.EndTime)
	t = time.AfterFunc(duration, func() {
		fmt.Println("Exam ended for room:", xm.Id)
		payload := struct {
			EndTime time.Time `json:"end_time"`
		}{
			EndTime: xm.EndTime,
		}
		evt := makeEvent("exam-ends-now", xm.Id, payload)
		eH.Broadcast <- evt
	})
	slog.Info("room timer set for exam end", "duration", duration)
	return t
}

func NewRoom(xm models.Exam, eH *ExamHub) *Room {
	status := getExamStatus(xm.StartTime, xm.EndTime)
	var t, t1 *time.Timer

	switch status {
	case "waiting":
		t = makeStartTimer(xm, eH)
		t1 = makeEndTimer(xm, eH)
		slog.Info("exam hasn't started yet, timer set for both exam-start and exam-end", "room", xm.Id)
	case "running":
		t = nil
		t1 = makeEndTimer(xm, eH)
		slog.Info("exam is running, timer set for only exam-end")
	case "ended":
		t = nil
		t1 = nil
		slog.Info("exam already ended, no timer set for room")
	}

	return &Room{
		Id:               xm.Id,
		Clients:          make(map[string]*Client),
		StartSignalTimer: t,
		EndSignalTimer:   t1,
		Exam:             xm,
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

func (eh *ExamHub) RemoveRoom(roomId string) error {
	delete(eh.Rooms, roomId)
	return nil
}

func (eh *ExamHub) CreateNewRoom(roomId string) error {
	if _, ok := eh.Rooms[roomId]; !ok {
		exam, err := eh.Storage.GetExamByExamId(roomId)
		if err != nil {
			slog.Info("error fetching exam for on-join event:", "error", err)
			return err
		}
		fmt.Println(exam.StartTime)

		eh.Rooms[roomId] = NewRoom(exam, eh)
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
	// fmt.Println("Broadcasting event to room:", event.RoomId)
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
				eh.RemoveRoom(cl.RoomId)
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

			writeOnJoinEvent(cl, r)

		} else {
			log.Println("client already exists in room.")
		}
	} else {
		log.Println("room does not exist:", cl.RoomId)
	}
}

func writeOnJoinEvent(c *Client, r *Room) {
	fmt.Println("sending Onjoin Event to client")
	examStatus := getExamStatus(r.Exam.StartTime, r.Exam.EndTime)
	var onJoinEvt *OnJoinEvent
	switch examStatus {
	case "waiting":
		onJoinEvt = &OnJoinEvent{
			ExamStatus: examStatus,
			Time:       r.Exam.StartTime,
			Title:      r.Exam.Title,
		}
	case "running":
		onJoinEvt = &OnJoinEvent{
			ExamStatus: examStatus,
			Time:       r.Exam.EndTime,
			Title:      r.Exam.Title,
		}
	case "ended":
		onJoinEvt = &OnJoinEvent{
			ExamStatus: examStatus,
			Time:       r.Exam.EndTime,
			Title:      r.Exam.Title,
		}
	}
	evt := makeEvent("on-join-room", c.RoomId, onJoinEvt)
	fmt.Println("on-join-room event ", evt)
	c.DirectSend(evt)
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
