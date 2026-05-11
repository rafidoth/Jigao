package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerAIConversationRoutes(r chi.Router, h *handler.AIConversationHandler) {
	r.Route("/ai", func(r chi.Router) {
		r.Route("/conversations", func(r chi.Router) {
			r.Post("/", h.CreateConversation)
			r.Post("/{conversation_id}/messages", h.AppendMessage)
		})
	})
}
