package exams

import "time"

type Event struct {
	EventType              string `json:"eventType"`
	RoomId                 string `json:"roomId"`
	ExamStatus             string `json:"examStatus"`
	RemainingTimeInSeconds int    `json:"remainingTimeInSeconds"`
}

func newEvent(rId, eStatus string, rTime int) *Event {
	return &Event{
		EventType:              "on-join-room",
		RoomId:                 rId,
		ExamStatus:             eStatus,
		RemainingTimeInSeconds: rTime,
	}
}

type OnJoinEvent struct {
	EventType  string    `json:"eventType"`
	RoomId     string    `json:"roomId"`
	ExamStatus string    `json:"examStatus"`
	StartTime  time.Time `json:"startTime"`
}
