package main

import (
	"log"
	"net/http"

	"github.com/dhruwanga19/expense-tracker/config"
	"github.com/dhruwanga19/expense-tracker/handlers"
	"github.com/dhruwanga19/expense-tracker/middleware"
	"github.com/dhruwanga19/expense-tracker/utils"

	"github.com/gorilla/mux"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Error loading configuration:", err)
	}

	// Connect to database
	db, err := utils.ConnectDB(cfg.MongoURI)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer utils.DisconnectDB(db)

	// Initialize router
	r := mux.NewRouter()

	// Set up routes
	handlers.SetupExpenseRoutes(r, db)
	handlers.SetupCategoryRoutes(r, db)
	// handlers.SetupBillRoutes(r, db)

	// Apply middleware
	corsRouter := middleware.CORS(r)

	// Start server
	log.Printf("Server is running on http://localhost:%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, corsRouter))
}
