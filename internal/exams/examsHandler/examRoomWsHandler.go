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

type ExamRole string

func (er ExamRole) Monitor() string {
	return "monitor"
}

func (er ExamRole) Participant() string {
	return "participant"
}

func (h *ExamsHandler) getQueryParam(r *http.Request, want string) string {
	qP := r.URL.Query()
	p := qP.Get(want)
	return p
}

// func (wh *ExamsHandler) CreateRoom(
// 	w http.ResponseWriter,
// 	r *http.Request,
// ) {
// 	// each exam will have a single room (1:1 mapping)
// 	examId := chi.URLParam(r, "exam_id")
// 	fmt.Println("Creating room for exam id:", examId)

// 	if err := wh.hub.CreateNewRoom(examId); err != nil {
// 		log.Println("error creating new room:", err)
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}

// 	w.WriteHeader(http.StatusCreated)
// }

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

func (eh *ExamsHandler) JoinRoom(
	w http.ResponseWriter,
	r *http.Request,
) {

	userId, ok := r.Context().Value("user-id").(string)
	if !ok || userId == "" {
		slog.Error("user id not found in context")
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}
	fmt.Println("join request from user id : ", userId)
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

	// /exams/join-room/{room_id}
	roomId := chi.URLParam(r, "room_id")
	room := eh.hub.GetRoom(roomId)
	if room == nil {
		// no room found
		slog.Info("no room found with id:", "room_id:", roomId)
		// check if there is an exam with this id
		err := eh.store.IsExamExists(roomId)
		if err != nil {
			slog.Info("no exam found with id:", "error:", err)
			http.Error(w, "No room or exam found with given id", http.StatusNotFound)
			return
		}

		// if yes, create a room
		slog.Info("exam found, creating room:", "exam_id:", roomId)
		if err := eh.hub.CreateNewRoom(roomId); err != nil {
			slog.Error("error creating new room:", "error:", err)
			return
		}
		slog.Info("new room created successfully:", "room_id:", roomId)
	}

	clientType := eh.determineClientType(userId, roomId)

	client := exams.NewClient(conn, clientType, userId, roomId)
	if client == nil {
		http.Error(w, "Invalid client type", http.StatusBadRequest)
		return
	}
	eh.hub.Register <- client
	go client.Write()
	go client.Read(eh.hub)
}

func (eh *ExamsHandler) determineClientType(userId, examId string) string {
	monitor, participant := "monitor", "participant"
	exam, err := eh.store.GetExamByExamId(examId)
	if err != nil {
		slog.Error("Error getting Exam By Exam Id", "error", err)
	}

	// if visibility is private -> always participant
	if exam.Visibility == "private" {
		return participant
	}

	// if visibility is public
	// 			-> who has set access 		-> monitor
	// 			-> anyone joining the link  -> participant
	if exam.Visibility == "public" {
		set_id := exam.SetId
		owner_id, err := eh.qStore.GetOwnerUserId(set_id)
		if err != nil {
			slog.Error("Owner Id Error", "error", err)
		}
		if owner_id == userId {
			return monitor
		}
		chk, err := eh.qStore.CheckUserAccess(userId, set_id)
		if chk {
			return monitor
		}
		return participant
	}
	//if visibility is restricted
	// 			-> who has set access 		-> monitor
	// 			-> if user is allowed 		-> participant
	if exam.Visibility == "restricted" {
		return participant
	}
	return participant
}
