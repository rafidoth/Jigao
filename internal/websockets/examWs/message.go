package examWs

// NewErrorMessage creates an error message
func NewErrorMessage(message, code string) Message {
	return Message{
		Type: MsgTypeError,
		Payload: ErrorPayload{
			Message: message,
			Code:    code,
		},
	}
}

// NewOnJoinRoomMessage creates the initial join room message
func NewOnJoinRoomMessage(status, time, title, role string, participants []string) Message {
	return Message{
		Type: MsgTypeOnJoinRoom,
		Payload: OnJoinRoomPayload{
			ExamStatus:   status,
			Time:         time,
			Title:        title,
			Role:         role,
			Participants: participants,
		},
	}
}

// NewExamStartsMessage creates exam start broadcast message
func NewExamStartsMessage(endTime string) Message {
	return Message{
		Type: MsgTypeExamStartsNow,
		Payload: ExamStartsPayload{
			EndTime: endTime,
		},
	}
}

// NewExamEndsMessage creates exam end broadcast message
func NewExamEndsMessage(endTime string) Message {
	return Message{
		Type: MsgTypeExamEndsNow,
		Payload: ExamEndsPayload{
			EndTime: endTime,
		},
	}
}

// NewAnswerSavedMessage creates answer saved ACK
func NewAnswerSavedMessage(questionIDs []string) Message {
	return Message{
		Type: MsgTypeAnswerSaved,
		Payload: AnswerSavedPayload{
			Saved_count: len(questionIDs),
			QuestionIDs: questionIDs,
		},
	}
}

// NewSubmitAcceptedMessage creates submit accepted ACK for participant
func NewSubmitAcceptedMessage(examID, submittedAt string) Message {
	return Message{
		Type: MsgTypeSubmitAccepted,
		Payload: SubmitAcceptedPayload{
			ExamID:      examID,
			SubmittedAt: submittedAt,
		},
	}
}

// NewViolationAlertMessage creates violation alert for controllers
func NewViolationAlertMessage(userID, violationType string, count int) Message {
	return Message{
		Type: MsgTypeViolationAlert,
		Payload: ViolationAlertPayload{
			UserID:         userID,
			ViolationType:  violationType,
			ViolationCount: count,
		},
	}
}

// NewCameraUpdateMessage creates camera status update for controllers
func NewCameraUpdateMessage(userID string, active bool) Message {
	return Message{
		Type: MsgTypeCameraUpdate,
		Payload: CameraUpdatePayload{
			UserID: userID,
			Active: active,
		},
	}
}

// NewWarningMessage creates warning message for participant
func NewWarningMessage(message, fromUserID string) Message {
	return Message{
		Type: MsgTypeWarningReceived,
		Payload: WarningPayload{
			Message:    message,
			FromUserId: fromUserID,
		},
	}
}

// NewKickedMessage creates kicked message for participant
func NewKickedMessage(reason string) Message {
	return Message{
		Type: MsgTypeKicked,
		Payload: KickedPayload{
			Reason: reason,
		},
	}
}

// NewParticipantJoinedMessage creates participant joined message for controllers
func NewParticipantJoinedMessage(userID string) Message {
	return Message{
		Type: MsgTypeParticipantJoined,
		Payload: ParticipantEventPayload{
			UserID: userID,
		},
	}
}

// NewParticipantLeftMessage creates participant left message for controllers
func NewParticipantLeftMessage(userID string) Message {
	return Message{
		Type: MsgTypeParticipantLeft,
		Payload: ParticipantEventPayload{
			UserID: userID,
		},
	}
}

// NewServerShutdownMessage creates server shutdown notice
func NewServerShutdownMessage() Message {
	return Message{
		Type: MsgTypeServerShutdown,
		Payload: ServerShutdownPayload{
			Message: "Server is restarting, please reconnect shortly",
		},
	}
}

// NewRoomStateMessage creates full room state message for controllers
func NewRoomStateMessage(status, startTime, endTime string, participants []ParticipantSnapshot) Message {
	return Message{
		Type: MsgTypeRoomState,
		Payload: RoomStatePayload{
			ExamStatus:   status,
			StartTime:    startTime,
			EndTime:      endTime,
			Participants: participants,
		},
	}
}
