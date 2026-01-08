package utils

import "net/http"

func WriteOk(w *http.ResponseWriter) {
	(*w).WriteHeader(http.StatusOK)
}
