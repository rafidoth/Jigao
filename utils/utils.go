package utils

import (
	"errors"
	"net/http"
)

func ExtractUserId(r *http.Request) (string, error) {
	uid, ok := r.Context().Value("user-id").(string)
	if !ok {
		return "", errors.New("Unable to extract user id from http.Request")
	}
	return uid, nil
}
