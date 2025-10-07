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
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Event
}

func NewExamHub() *ExamHub {
	return &ExamHub{
		Rooms:      make(map[string]*Room),
		register:   make(chan *Client, 10),
		unregister: make(chan *Client, 10),
		broadcast:  make(chan *Event, 10),
	}
}

func (eh *ExamHub) CreateNewRoom(roomId string) error {
	if _, ok := eh.Rooms[roomId]; !ok {
		eh.Rooms[roomId] = NewRoom(roomId, roomId)
		return nil
	}
	return errors.New("room already exists")
}

func (eh *ExamHub) Run() {
	for {
		select {
		//client to be registered
		case cl := <-eh.register:
			if _, exists := eh.Rooms[cl.RoomId]; exists {
				r := eh.Rooms[cl.RoomId]
				if _, exists := r.Clients[cl.Id]; !exists {
					c := eh.Rooms[cl.RoomId].Clients
					c[cl.Id] = cl
					log.Println("client registered to room:",
						cl.RoomId,
						"client id:",
						cl.Id)
				}
			}
		//client to be unregistered
		case cl := <-eh.unregister:
			if _, exists := eh.Rooms[cl.RoomId]; exists {
				if _, exists := eh.Rooms[cl.RoomId].Clients[cl.Id]; exists {
					delete(eh.Rooms[cl.RoomId].Clients, cl.Id)
					close(cl.Evt)
					log.Println("client unregistered from room:",
						cl.RoomId,
						"client id:",
						cl.Id)
				}
			}

		//broadcast to all clients in a room
		case event := <-eh.broadcast:
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
