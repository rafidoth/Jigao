package exam

// =============================================================================
// Message Type Constants
// =============================================================================

// Outbound message types (server → client)
const (
	MsgTypeOnJoinRoom        = "on-join-room"
	MsgTypeExamStartsNow     = "exam-starts-now"
	MsgTypeExamEndsNow       = "exam-ends-now"
	MsgTypeParticipantJoined = "participant-joined"
	MsgTypeParticipantLeft   = "participant-left"
	MsgTypeViolationAlert    = "violation-alert"
	MsgTypeCameraUpdate      = "camera-update"
	MsgTypeWarningReceived   = "warning-received"
	MsgTypeKicked            = "kicked"
	MsgTypeAnswerSaved       = "answer-saved"
	MsgTypeRoomState         = "room-state"
	MsgTypeServerShutdown    = "server-shutdown"
	MsgTypeError             = "error"
)

// Inbound message types (client → server)
const (
	MsgTypeAnswerUpdate    = "answer_update"
	MsgTypeSubmitExam      = "submit_exam"
	MsgTypeViolationReport = "violation_report"
	MsgTypeCameraStatus    = "camera_status"
	MsgTypeCameraSnapshot  = "camera_snapshot"
	MsgTypeStartExam       = "start_exam"
	MsgTypeEndExam         = "end_exam"
	MsgTypeWarnParticipant = "warn_participant"
	MsgTypeKickParticipant = "kick_participant"
)

// =============================================================================
// Client Role Constants
// =============================================================================

const (
	RoleController  = "controller"
	RoleParticipant = "participant"
)

// =============================================================================
// Room State Constants
// =============================================================================

const (
	RoomStateWaiting  = "waiting"
	RoomStateLive     = "live"
	RoomStateFinished = "finished"
)
