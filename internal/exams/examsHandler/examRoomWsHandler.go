package examsHandler

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/rafidoth/onlyexams/internal/exams"
)

func (wh *ExamsHandler) CreateRoom(
	w http.ResponseWriter,
	r *http.Request,
) {
	// each exam will have a single room (1:1 mapping)
	examId := chi.URLParam(r, "exam_id")
	fmt.Println("Creating room for exam id:", examId)

	if err := wh.hub.CreateNewRoom(examId); err != nil {
		log.Println("error creating new room:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// for now allow all connections
		origin := r.Header.Get("Origin")
		fmt.Println("Origin:", origin)
		return true
	},
}

func (wh *ExamsHandler) JoinRoom(
	w http.ResponseWriter,
	r *http.Request,
) {
	userId, ok := r.Context().Value("user-id").(string)
	if !ok || userId == "" {
		slog.Error("user id not found in context")
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println("error upgrading connection:", err)
		http.Error(
			w,
			"Could not open websocket connection",
			http.StatusBadRequest,
		)
		return
	}

	// /exams/join-room/{room_id}?role=p(participant)/c(controller)
	roomId := chi.URLParam(r, "room_id")
	room := wh.hub.GetRoom(roomId)
	if room == nil {
		// no room found
		slog.Info("no room found with id:", "room_id:", roomId)
		// check if there is an exam with this id
		err := wh.store.IsExamExists(roomId)
		if err != nil {
			slog.Info("no exam found with id:", "error:", err)
			http.Error(w, "No room or exam found with given id", http.StatusNotFound)
			return
		}

		// if yes, create a room
		slog.Info("exam found, creating room:", "exam_id:", roomId)
		if err := wh.hub.CreateNewRoom(roomId); err != nil {
			slog.Error("error creating new room:", "error:", err)
			return
		}
		slog.Info("new room created successfully:", "room_id:", roomId)
	}

	clientType := r.URL.Query().Get("role")

	client := exams.NewClient(conn, clientType, userId, roomId)
	if client == nil {
		http.Error(w, "Invalid client type", http.StatusBadRequest)
		return
	}
	wh.hub.Register <- client
	go client.Write()
	go client.Read(wh.hub)

}
