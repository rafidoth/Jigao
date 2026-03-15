package v1

import (
	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/onlyexams/internal/handler"
)

func registerSetRoutes(r chi.Router, h *handler.SetHandler) {
	r.Route("/sets", func(r chi.Router) {
		r.Get("/", h.GetRecentSets)
		r.Post("/", h.CreateNewSet)
		r.Post("/save_generated", h.SaveGeneratedQuestions)
		r.Get("/{set_id}", h.GetASet)
		r.Put("/{set_id}", h.UpdateASet)
		r.Delete("/{set_id}", h.DeleteASet)
		r.Get("/access_list/{set_id}", h.GetSetAccessList)
		r.Post("/access", h.AllowSetAccess)
	})
}
