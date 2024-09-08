package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/dhruwanga19/expense-tracker/models"
	"github.com/dhruwanga19/expense-tracker/services"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func SetupCategoryRoutes(r *mux.Router, db *mongo.Database) {
	categoryService := services.NewCategoryService(db)

	r.HandleFunc("/api/categories", getCategoriesHandler(categoryService)).Methods("GET")
	r.HandleFunc("/api/categories", addCategoryHandler(categoryService)).Methods("POST")
	r.HandleFunc("/api/categories/{id}", deleteCategoryHandler(categoryService)).Methods("DELETE")
	r.HandleFunc("/api/categories/{id}", updateCategoryHandler(categoryService)).Methods("PUT")
}

func getCategoriesHandler(s *services.CategoryService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		categories, err := s.GetCategories(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(categories)
	}
}

func addCategoryHandler(s *services.CategoryService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var category models.Category
		err := json.NewDecoder(r.Body).Decode(&category)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		err = s.AddCategory(r.Context(), &category)
		if err != nil {
			http.Error(w, "Could not add category", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(category)

	}
}

func deleteCategoryHandler(s *services.CategoryService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		id, err := primitive.ObjectIDFromHex(params["id"])
		if err != nil {
			http.Error(w, "Invalid Category ID", http.StatusBadRequest)
			return
		}

		err = s.DeleteCategory(r.Context(), id)
		if err != nil {
			log.Printf("Error deleting category: %v", err)
			if err == mongo.ErrNoDocuments {
				http.Error(w, "Category not found", http.StatusNotFound)
			} else {
				errMsg := fmt.Sprintf("Internal server error: %v", err)
				http.Error(w, errMsg, http.StatusInternalServerError)
			}
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func updateCategoryHandler(s *services.CategoryService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		id, err := primitive.ObjectIDFromHex(params["id"])
		if err != nil {
			http.Error(w, "Invalid category ID", http.StatusBadRequest)
			return
		}

		var updatedCategory models.Category
		err = json.NewDecoder(r.Body).Decode(&updatedCategory)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		updatedCategory.ID = id
		err = s.UpdateCategory(r.Context(), &updatedCategory)
		if err != nil {
			switch err {
			case services.ErrCategoryNameExists:
				http.Error(w, "A category with this name already exists", http.StatusConflict)
			case services.ErrCategoryColorExists:
				http.Error(w, "A category with this color already exists", http.StatusConflict)
			case mongo.ErrNoDocuments:
				http.Error(w, "Category not found", http.StatusNotFound)
			default:
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(updatedCategory)
	}
}
