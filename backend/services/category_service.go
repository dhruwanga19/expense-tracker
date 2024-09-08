package services

import (
	"context"
	"errors"
	"log"
	"strings"

	"github.com/dhruwanga19/expense-tracker/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CategoryService struct {
	categoriesCollection *mongo.Collection
	expensesCollection   *mongo.Collection
}

var (
	ErrCategoryNameExists  = errors.New("a category with this name already exists")
	ErrCategoryColorExists = errors.New("a category with this color already exists")
)

func NewCategoryService(db *mongo.Database) *CategoryService {
	return &CategoryService{
		categoriesCollection: db.Collection("categories"),
		expensesCollection:   db.Collection("my-expenses"),
	}
}

func (s *CategoryService) GetCategories(ctx context.Context) ([]models.Category, error) {
	cursor, err := s.categoriesCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var categories []models.Category
	if err = cursor.All(ctx, &categories); err != nil {
		return nil, err
	}

	return categories, nil
}

func (s *CategoryService) AddCategory(ctx context.Context, category *models.Category) error {
	result, err := s.categoriesCollection.InsertOne(ctx, category)
	if err != nil {
		return err
	}
	category.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (s *CategoryService) DeleteCategory(ctx context.Context, id primitive.ObjectID) error {

	// Start a mongodb session
	session, err := s.categoriesCollection.Database().Client().StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	// Start a transaction
	// err = session.StartTransaction()
	// if err != nil {
	// 	return err
	// }

	//Define a callback function to run delete operation
	callback := func(sessionContext mongo.SessionContext) (interface{}, error) {

		// Delete the category
		_, err := s.categoriesCollection.DeleteOne(sessionContext, bson.M{"_id": id})
		if err != nil {
			return nil, err

		}

		// Delete all expenses with the category id
		_, err = s.expensesCollection.DeleteMany(sessionContext, bson.M{"category_id": id})
		if err != nil {
			return nil, err
		}

		return nil, nil
	}

	// Run the callback function
	_, err = session.WithTransaction(ctx, callback)
	if err != nil {
		log.Printf("Transaction failed: %v", err)
		return err
	}

	return nil

}
func (s *CategoryService) UpdateCategory(ctx context.Context, category *models.Category) error {
	// Check if the name already exists (excluding the current category)
	var existingCategory models.Category
	err := s.categoriesCollection.FindOne(ctx, bson.M{
		"_id":  bson.M{"$ne": category.ID},
		"name": bson.M{"$regex": primitive.Regex{Pattern: "^" + category.Name + "$", Options: "i"}},
	}).Decode(&existingCategory)
	if err == nil {
		return ErrCategoryNameExists
	} else if err != mongo.ErrNoDocuments {
		return err
	}

	// Check if the color already exists (excluding the current category)
	err = s.categoriesCollection.FindOne(ctx, bson.M{
		"_id":   bson.M{"$ne": category.ID},
		"color": strings.ToLower(category.Color),
	}).Decode(&existingCategory)
	if err == nil {
		return ErrCategoryColorExists
	} else if err != mongo.ErrNoDocuments {
		return err
	}

	// Convert color to lowercase before saving
	category.Color = strings.ToLower(category.Color)

	filter := bson.M{"_id": category.ID}
	update := bson.M{"$set": bson.M{"name": category.Name, "color": category.Color}}

	result, err := s.categoriesCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.ModifiedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}
