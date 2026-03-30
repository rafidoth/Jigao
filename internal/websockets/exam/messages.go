package exam

import "encoding/json"

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

// =============================================================================
// Message Envelope
// =============================================================================

// Message is the envelope for all WebSocket messages
type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

// RawMessage is used for parsing incoming messages before type detection
type RawMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// =============================================================================
// Outbound Payloads (Server → Client)
// =============================================================================

// OnJoinRoomPayload is sent when a client first connects
type OnJoinRoomPayload struct {
	ExamStatus string `json:"examStatus"`
	Time       string `json:"time,omitempty"` // ISO8601 - start_time if waiting, end_time if running
	Title      string `json:"title"`
	Role       string `json:"role"`
}

// ExamStartsPayload is sent when exam transitions to live
type ExamStartsPayload struct {
	EndTime string `json:"end_time"`
}

// ExamEndsPayload is sent when exam finishes
type ExamEndsPayload struct {
	EndTime string `json:"end_time"`
}

// ParticipantEventPayload is sent for join/leave events
type ParticipantEventPayload struct {
	UserID   string `json:"user_id"`
	Name     string `json:"name"`
	ImageURL string `json:"image_url,omitempty"`
}

// ViolationAlertPayload is sent to controllers when a violation occurs
type ViolationAlertPayload struct {
	UserID         string `json:"user_id"`
	Name           string `json:"name"`
	ViolationType  string `json:"violation_type"`
	ViolationCount int    `json:"violation_count"`
}

// CameraUpdatePayload is sent to controllers on camera state change
type CameraUpdatePayload struct {
	UserID string `json:"user_id"`
	Name   string `json:"name"`
	Active bool   `json:"active"`
}

// WarningPayload is sent to participant when warned by controller
type WarningPayload struct {
	Message string `json:"message"`
	From    string `json:"from,omitempty"`
}

// KickedPayload is sent to participant when kicked by controller
type KickedPayload struct {
	Reason string `json:"reason,omitempty"`
}

// AnswerSavedPayload is ACK for answer save
type AnswerSavedPayload struct {
	QuestionID string `json:"question_id"`
}

// RoomStatePayload is full state dump for controllers
type RoomStatePayload struct {
	ExamStatus   string                `json:"exam_status"`
	StartTime    string                `json:"start_time,omitempty"`
	EndTime      string                `json:"end_time,omitempty"`
	Participants []ParticipantSnapshot `json:"participants"`
}

// ParticipantSnapshot represents a participant's current state
type ParticipantSnapshot struct {
	UserID         string `json:"user_id"`
	Name           string `json:"name"`
	ImageURL       string `json:"image_url"`
	Status         string `json:"status"`
	CameraActive   bool   `json:"camera_active"`
	ViolationCount int    `json:"violation_count"`
	IsOnline       bool   `json:"is_online"`
}

// ErrorPayload is sent for errors
type ErrorPayload struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// ServerShutdownPayload is sent before server shuts down
type ServerShutdownPayload struct {
	Message string `json:"message"`
}

// =============================================================================
// Inbound Payloads (Client → Server)
// =============================================================================

// AnswerUpdatePayload is sent when participant saves an answer
type AnswerUpdatePayload struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
}

// SubmitExamPayload is sent when participant submits exam
type SubmitExamPayload struct {
	ExamID  string            `json:"exam_id"`
	Answers map[string]string `json:"answers"`
}

// ViolationReportPayload is sent by browser when violation detected
type ViolationReportPayload struct {
	Type    string                 `json:"type"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// CameraStatusPayload is sent when camera state changes
type CameraStatusPayload struct {
	Active bool `json:"active"`
}

// CameraSnapshotPayload is sent with periodic camera capture
type CameraSnapshotPayload struct {
	ImageBase64 string `json:"image_base64"`
}

// WarnParticipantPayload is sent by controller to warn a participant
type WarnParticipantPayload struct {
	UserID  string `json:"user_id"`
	Message string `json:"message"`
}

// KickParticipantPayload is sent by controller to kick a participant
type KickParticipantPayload struct {
	UserID string `json:"user_id"`
	Reason string `json:"reason,omitempty"`
}
