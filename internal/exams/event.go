package exams

import "time"

type Event struct {
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
	Payload   any       `json:"payload"`
	RoomId    string    `json:"room_id"`
}

func makeEvent(t, rId string, payload any) *Event {
	return &Event{
		Type:      t,
		Timestamp: time.Now(),
		RoomId:    rId,
		Payload:   payload,
	}
}

type OnJoinEvent struct {
	ExamStatus string    `json:"examStatus"`
	Time       time.Time `json:"time"`
	Title      string    `json:"title"`
}

type AnswerSelectEvent struct {
	ExamId     string `json:"exam_id"`
	UserId     string `json:"user_id"`
	QuestionId string `json:"question_id"`
	Answer     string `json:"answer"`
}
