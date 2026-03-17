package router

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"

	scalar "github.com/MarceloPetrucio/go-scalar-api-reference"
)

func RegisterOpenAPIRoutes(r chi.Router) {
	r.Get("/docs/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		http.ServeFile(w, r, "docs/swagger.json")
	})

	r.Get("/reference", func(w http.ResponseWriter, r *http.Request) {
		htmlContent, err := scalar.ApiReferenceHTML(&scalar.Options{
			SpecURL: "./docs/swagger.json",
			CustomOptions: scalar.CustomOptions{
				PageTitle: "Jigao API",
			},
			DarkMode: true,
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to render API reference: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		fmt.Fprint(w, htmlContent)
	})
}
