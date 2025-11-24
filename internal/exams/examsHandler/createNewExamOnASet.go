package examsHandler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
)

type CreateExamOnASetRequest struct {
	SetId             string    `json:"set_id"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	StartTime         time.Time `json:"start_time"`
	DurationInMinutes int       `json:"duration_in_minutes"`
}

func (eh *ExamsHandler) CreateExamOnASet(
	w http.ResponseWriter,
	r *http.Request,
) {
	userId, err := eh.extractUserId(r)
	if err != nil {
		slog.Warn("failed to extract user id from request")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	var req CreateExamOnASetRequest
	body, err := io.ReadAll(r.Body)
	if err != nil {
		slog.Warn("failed to read request body", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = json.Unmarshal(body, &req)
	if err != nil {
		slog.Warn("failed to marshal request body", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	fmt.Println("request body:", req)
	err = serviceLogicsCheck(req)
	if err != nil {
		slog.Warn("failed to validate request body", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = eh.store.CreateExamOnASet(
		userId,
		req.SetId,
		req.Title,
		req.Description,
		req.StartTime,
		req.DurationInMinutes,
	)
	if err != nil {
		slog.Error("failed to create exam on a set DB issue", "error", err)
		http.Error(
			w,
			"Internal Server Error",
			http.StatusInternalServerError,
		)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func serviceLogicsCheck(r CreateExamOnASetRequest) error {
	if r.SetId == "" {
		return errors.New("set_id is required")
	}
	if r.Title == "" {
		return errors.New("title is required")
	}
	if r.DurationInMinutes <= 0 {
		return errors.New("duration_in_minutes must be greater than 0")
	}
	if r.StartTime.Before(time.Now()) {
		return errors.New("start_time must be in the future")
	}

	return nil
}
