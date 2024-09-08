package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/dhruwanga19/expense-tracker/models"
	"github.com/dhruwanga19/expense-tracker/services"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func SetupExpenseRoutes(r *mux.Router, db *mongo.Database) {
	expenseService := services.NewExpenseService(db)

	r.HandleFunc("/api/expenses", getExpensesHandler(expenseService)).Methods("GET")
	r.HandleFunc("/api/expenses", addExpenseHandler(expenseService)).Methods("POST")
	r.HandleFunc("/api/expenses/{id}", updateExpenseHandler(expenseService)).Methods("PUT")
	r.HandleFunc("/api/expenses/delete", deleteExpensesHandler(expenseService)).Methods("POST")
}

func getExpensesHandler(s *services.ExpenseService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expenses, err := s.GetExpenses(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(expenses)
	}
}

func addExpenseHandler(s *services.ExpenseService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var expense models.Expense
		err := json.NewDecoder(r.Body).Decode(&expense)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		err = s.AddExpense(r.Context(), &expense)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(expense)
	}
}

func updateExpenseHandler(s *services.ExpenseService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		id, err := primitive.ObjectIDFromHex(params["id"])
		if err != nil {
			http.Error(w, "Invalid Expense ID", http.StatusBadRequest)
			return
		}

		filter := bson.M{"_id": id}
		var updatedExpense models.Expense

		erro := json.NewDecoder(r.Body).Decode(&updatedExpense)
		if erro != nil {
			http.Error(w, erro.Error(), http.StatusBadRequest)
			return
		}

		err = s.UpdateExpense(r.Context(), &updatedExpense, filter)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(updatedExpense)
	}
}

func deleteExpensesHandler(s *services.ExpenseService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var deleteRequest models.DeleteExpensesRequest
		err := json.NewDecoder(r.Body).Decode(&deleteRequest)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		ids := make([]primitive.ObjectID, 0, len(deleteRequest.IDs))
		for _, id := range deleteRequest.IDs {
			objID, err := primitive.ObjectIDFromHex(id)
			if err != nil {
				http.Error(w, "Invalid Expense ID", http.StatusBadRequest)
				return
			}
			ids = append(ids, objID)
		}

		filter := bson.M{"_id": bson.M{"$in": ids}}
		result, err := s.DeleteExpenses(r.Context(), filter)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int64{"deleted": result})

	}
}
