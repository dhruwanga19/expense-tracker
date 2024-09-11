package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/dhruwanga19/expense-tracker/models"
	"github.com/dhruwanga19/expense-tracker/services"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func SetupBillRoutes(r *mux.Router, billService *services.BillService) {
	r.HandleFunc("/api/bills", uploadBillHandler(billService)).Methods("POST")
	r.HandleFunc("/api/bills/{id}", getBillHandler(billService)).Methods("GET")
	r.HandleFunc("/api/bills/{id}/expenses/{expenseId}", updateBillExpenseHandler(billService)).Methods("PUT")
	r.HandleFunc("/api/bills/{id}/confirm", confirmExpensesHandler(billService)).Methods("POST")
}

func uploadBillHandler(s *services.BillService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received bill upload request")

		// Parse the multipart form
		err := r.ParseMultipartForm(10 << 20) // 10 MB max
		if err != nil {
			log.Printf("Error parsing multipart form: %v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Get the file from the form
		file, header, err := r.FormFile("bill")
		if err != nil {
			log.Printf("Error getting file from form: %v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer file.Close()

		log.Printf("Received file: %s, size: %d bytes", header.Filename, header.Size)

		// Create a new bill document
		bill, err := s.CreateBill(r.Context(), header.Filename, header.Header.Get("Content-Type"))
		if err != nil {
			log.Printf("Error creating bill document: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Process the bill
		log.Printf("Processing bill with ID: %s", bill.ID.Hex())
		err = s.ProcessBill(r.Context(), bill.ID, file)
		if err != nil {
			log.Printf("Error processing bill: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		log.Println("Bill processed successfully")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": bill.ID.Hex()})
	}
}

func getBillHandler(s *services.BillService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received bill request")
		params := mux.Vars(r)
		id, err := primitive.ObjectIDFromHex(params["id"])
		if err != nil {
			log.Printf("Invalid bill ID: %v", err)
			http.Error(w, "Invalid bill ID", http.StatusBadRequest)
			return
		}

		bill, err := s.GetBill(r.Context(), id)
		if err != nil {
			log.Printf("Error getting bill: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(bill)
	}
}

func updateBillExpenseHandler(s *services.BillService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		billID, err := primitive.ObjectIDFromHex(params["id"])
		if err != nil {
			http.Error(w, "Invalid bill ID", http.StatusBadRequest)
			return
		}
		expenseID, err := primitive.ObjectIDFromHex(params["expenseId"])
		if err != nil {
			http.Error(w, "Invalid expense ID", http.StatusBadRequest)
			return
		}

		var updatedExpense models.Expense
		err = json.NewDecoder(r.Body).Decode(&updatedExpense)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		err = s.UpdateBillExpense(r.Context(), billID, expenseID, &updatedExpense)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func confirmExpensesHandler(s *services.BillService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received expense confirmation request")
		params := mux.Vars(r)
		billID, err := primitive.ObjectIDFromHex(params["id"])
		if err != nil {
			log.Println("Invalid bill ID:", err)
			http.Error(w, "Invalid bill ID", http.StatusBadRequest)
			return
		}

		var expenses []models.Expense
		err = json.NewDecoder(r.Body).Decode(&expenses)
		if err != nil {
			log.Printf("Error decoding expenses: %v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		err = s.ConfirmExpenses(r.Context(), billID, expenses)
		if err != nil {
			log.Println("Error confirming expenses:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Expenses confirmed successfully"})
	}
}
