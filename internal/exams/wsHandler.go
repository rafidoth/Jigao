package exams

//
// import (
// 	"fmt"
// 	"log"
// 	"net/http"
//
// 	"github.com/go-chi/chi/v5"
// 	"github.com/gorilla/websocket"
// )
//
// type Handler struct {
// 	hub *ExamHub
// }
//
// func NewHandler(eh *ExamHub) *Handler {
// 	return &Handler{
// 		hub: eh,
// 	}
// }
//
// func (wh *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
// 	// each exam will have a single room (1:1 mapping)
// 	examId := chi.URLParam(r, "exam_id")
// 	fmt.Println("Creating room for exam id:", examId)
//
// 	if err := wh.hub.CreateNewRoom(examId); err != nil {
// 		log.Println("error creating new room:", err)
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}
//
// 	w.WriteHeader(http.StatusCreated)
// }
//
// var upgrader = websocket.Upgrader{
// 	ReadBufferSize:  1024,
// 	WriteBufferSize: 1024,
// 	CheckOrigin: func(r *http.Request) bool {
// 		// for now allow all connections
// 		origin := r.Header.Get("Origin")
// 		fmt.Println("Origin:", origin)
// 		return true
// 	},
// }
//
// func (wh *Handler) JoinRoom(w http.ResponseWriter, r *http.Request) {
// 	conn, err := upgrader.Upgrade(w, r, nil)
//
// 	if err != nil {
// 		log.Println("error upgrading connection:", err)
// 		http.Error(
// 			w,
// 			"Could not open websocket connection",
// 			http.StatusBadRequest,
// 		)
// 		return
// 	}
//
// 	// /exams/join-room/{room_id}?user_id=user1&client_type=participant
// 	roomId := chi.URLParam(r, "room_id")
// 	room := wh.hub.GetRoom(roomId)
// 	if room == nil {
// 		// no room found
// 		// check if there is an exam with this id
// 		// if yes, create a room
// 		// else return error
// 	}
//
// 	userId := r.URL.Query().Get("user_id")
// 	clientType := r.URL.Query().Get("client_type")
//
// 	client := newClient(conn, clientType, userId, roomId)
// 	if client == nil {
// 		http.Error(w, "Invalid client type", http.StatusBadRequest)
// 		return
// 	}
// 	wh.hub.register <- client
// 	go client.write()
// 	go client.read(wh.hub)
//
// }
