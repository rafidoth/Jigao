package exams

type Event struct {
	RoomId string `json:"roomId"`
	UserId string `json:"username"`
	Evt    string `json:"event"`
	Data   string `json:"data"`
}

func newEvent(rId, uId, evt, data string) *Event {
	return &Event{
		RoomId: rId,
		UserId: uId,
		Evt:    evt,
		Data:   data,
	}
}
