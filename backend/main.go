package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Expense struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Name       string             `bson:"name" json:"name"`
	Amount     float64            `bson:"amount" json:"amount"`
	Date       time.Time          `bson:"date" json:"date"`
	CategoryID primitive.ObjectID `bson:"category_id" json:"categoryId"`
	Category   *Category          `bson:"category,omitempty" json:"category,omitempty"`
}

type Category struct {
	ID    primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Name  string             `bson:"name" json:"name"`
	Color string             `bson:"color" json:"color"`
}

type DeleteExpensesRequest struct {
	IDs []string `json:"ids"`
}

var client *mongo.Client
var categoriesCollection *mongo.Collection
var expensesCollection *mongo.Collection

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	ctx := context.Background()
	connectDB(ctx)
	defer disconnectDB(ctx)

	r := mux.NewRouter()

	r.HandleFunc("/api/expenses", getExpensesHandler).Methods("GET")
	r.HandleFunc("/api/expenses", addExpenseHandler).Methods("POST")
	r.HandleFunc("/api/categories", getCategoriesHandler).Methods("GET")
	r.HandleFunc("/api/categories", addCategoryHandler).Methods("POST")
	r.HandleFunc("/api/categories/{id}", deleteCategoryHandler).Methods("DELETE")
	r.HandleFunc("/api/expenses/{id}", updateExpenseHandler).Methods("PUT")
	r.HandleFunc("/api/categories/{id}", updateCategoryHandler).Methods("PUT")
	r.HandleFunc("/api/expenses/delete", deleteExpensesHandler).Methods("POST")

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})

	handler := c.Handler(r)

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func connectDB(ctx context.Context) {
	uri := os.Getenv("MONGODB_CONN_URI")
	if uri == "" {
		log.Fatal("You must set your 'MONGODB_URI' environmental variable. See\n\t https://www.mongodb.com/docs/drivers/go/current/usage-examples/#environment-variable")
	}
	clientOptions := options.Client().ApplyURI(uri)
	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	db := client.Database("expenses")
	categoriesCollection = db.Collection("categories")
	expensesCollection = db.Collection("my-expenses")

	log.Println("Connected to MongoDB!")
}

func disconnectDB(ctx context.Context) {
	if err := client.Disconnect(ctx); err != nil {
		log.Fatal(err)
	}
	log.Println("Disconnected from MongoDB.")
}

func getExpensesHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	expenses, err := getExpenses(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expenses)
}

func addExpenseHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var expense Expense
	err := json.NewDecoder(r.Body).Decode(&expense)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := expensesCollection.InsertOne(ctx, expense)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	expense.ID = result.InsertedID.(primitive.ObjectID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(expense)
}

func getCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	categories, err := getCategories(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func getExpenses(ctx context.Context) ([]Expense, error) {
	pipeline := mongo.Pipeline{
		{{
			"$lookup", bson.D{
				{"from", "categories"},
				{"localField", "category_id"},
				{"foreignField", "_id"},
				{"as", "category"},
			},
		}},
		{{"$unwind", "$category"}},
	}

	cursor, err := expensesCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var expenses []Expense
	if err = cursor.All(ctx, &expenses); err != nil {
		return nil, err
	}

	return expenses, nil
}

func getCategories(ctx context.Context) ([]Category, error) {
	cursor, err := categoriesCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var categories []Category
	if err = cursor.All(ctx, &categories); err != nil {
		return nil, err
	}

	return categories, nil
}

func addCategoryHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var category Category
	err := json.NewDecoder(r.Body).Decode(&category)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := categoriesCollection.InsertOne(ctx, category)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	category.ID = result.InsertedID.(primitive.ObjectID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(category)
}

func deleteCategoryHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	// Start a MongoDB session
	session, err := client.StartSession()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer session.EndSession(ctx)

	// Start a transaction
	err = session.StartTransaction()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Define a callback that executes the delete operations
	callback := func(sessCtx mongo.SessionContext) (interface{}, error) {
		// Delete the category
		_, err := categoriesCollection.DeleteOne(sessCtx, bson.M{"_id": id})
		if err != nil {
			return nil, err
		}

		// Delete all expenses associated with this category
		_, err = expensesCollection.DeleteMany(sessCtx, bson.M{"categoryId": id})
		if err != nil {
			return nil, err
		}

		return nil, nil
	}

	// Execute the transaction
	_, err = session.WithTransaction(ctx, callback)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func updateExpenseHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid expense ID", http.StatusBadRequest)
		return
	}

	var updatedExpense Expense
	err = json.NewDecoder(r.Body).Decode(&updatedExpense)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	filter := bson.M{"_id": id}
	update := bson.M{"$set": updatedExpense}

	result, err := expensesCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.ModifiedCount == 0 {
		http.Error(w, "Expense not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedExpense)
}

func updateCategoryHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	var updatedCategory Category
	err = json.NewDecoder(r.Body).Decode(&updatedCategory)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if the name already exists (excluding the current category)
	var existingCategory Category
	err = categoriesCollection.FindOne(ctx, bson.M{
		"_id":  bson.M{"$ne": id},
		"name": bson.M{"$regex": primitive.Regex{Pattern: "^" + updatedCategory.Name + "$", Options: "i"}},
	}).Decode(&existingCategory)
	if err == nil {
		http.Error(w, "A category with this name already exists", http.StatusConflict)
		return
	} else if err != mongo.ErrNoDocuments {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Check if the color already exists (excluding the current category)
	err = categoriesCollection.FindOne(ctx, bson.M{
		"_id":   bson.M{"$ne": id},
		"color": strings.ToLower(updatedCategory.Color),
	}).Decode(&existingCategory)
	if err == nil {
		http.Error(w, "A category with this color already exists", http.StatusConflict)
		return
	} else if err != mongo.ErrNoDocuments {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Convert color to lowercase before saving
	updatedCategory.Color = strings.ToLower(updatedCategory.Color)

	filter := bson.M{"_id": id}
	update := bson.M{"$set": bson.M{"name": updatedCategory.Name, "color": updatedCategory.Color}}

	result, err := categoriesCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.ModifiedCount == 0 {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	updatedCategory.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedCategory)
}

func deleteExpensesHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req DeleteExpensesRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var objectIDs []primitive.ObjectID
	for _, id := range req.IDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			http.Error(w, "Invalid expense ID", http.StatusBadRequest)
			return
		}
		objectIDs = append(objectIDs, objID)
	}

	filter := bson.M{"_id": bson.M{"$in": objectIDs}}
	result, err := expensesCollection.DeleteMany(ctx, filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]int64{"deleted": result.DeletedCount})
}
