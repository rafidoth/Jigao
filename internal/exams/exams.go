package exams

import (
	"errors"
	"fmt"
	"log"
)

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
}

func NewExamHub() *ExamHub {
	return &ExamHub{
		Rooms:      make(map[string]*Room),
		Register:   make(chan *Client, 10),
		Unregister: make(chan *Client, 10),
		Broadcast:  make(chan *Event, 10),
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

					msg := fmt.Sprintf(
						"A new %v joined the exam",
						cl.ClientType,
					)
					evt := newEvent(cl.RoomId, cl.Id, "join-noti", msg)
					eh.Broadcast <- evt
				} else {
					log.Println("client already exists in room.")
				}
			} else {
				log.Println("room does not exist:", cl.RoomId)
			}
		//client to be unregistered
		case cl := <-eh.Unregister:
			if _, exists := eh.Rooms[cl.RoomId]; exists {
				if _, ok := eh.Rooms[cl.RoomId].Clients[cl.Id]; ok {
					delete(eh.Rooms[cl.RoomId].Clients, cl.Id)
					close(cl.Evt)
					log.Println("client unregistered from room:",
						cl.RoomId,
						"client id:",
						cl.Id)
				}
			}

		//broadcast to all clients in a room
		case event := <-eh.Broadcast:
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
	}
}
