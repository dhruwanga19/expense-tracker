package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/dhruwanga19/expense-tracker/models"
	"github.com/dhruwanga19/expense-tracker/services"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func SetupBudgetGoalRoutes(r *mux.Router, service *services.BudgetGoalService) {
	r.HandleFunc("/api/budget-goals", getBudgetGoalsHandler(service)).Methods("GET")
	r.HandleFunc("/api/budget-goals", createBudgetGoalHandler(service)).Methods("POST")
	r.HandleFunc("/api/budget-goals/{id}", updateBudgetGoalHandler(service)).Methods("PUT")
	r.HandleFunc("/api/budget-goals/{id}", deleteBudgetGoalHandler(service)).Methods("DELETE")
}

func getBudgetGoalsHandler(s *services.BudgetGoalService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		goals, err := s.GetBudgetGoals(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(goals)
	}
}

func createBudgetGoalHandler(s *services.BudgetGoalService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var goal models.BudgetGoal
		if err := json.NewDecoder(r.Body).Decode(&goal); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err := s.CreateBudgetGoal(r.Context(), &goal); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(goal)
	}
}

func updateBudgetGoalHandler(s *services.BudgetGoalService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
		var goal models.BudgetGoal
		if err := json.NewDecoder(r.Body).Decode(&goal); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		goal.ID = id
		if err := s.UpdateBudgetGoal(r.Context(), &goal); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(goal)
	}
}

func deleteBudgetGoalHandler(s *services.BudgetGoalService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
		if err := s.DeleteBudgetGoal(r.Context(), id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
