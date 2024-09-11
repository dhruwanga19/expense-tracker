package services

import (
	"context"
	"log"

	"github.com/dhruwanga19/expense-tracker/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ExpenseService struct {
	collection *mongo.Collection
}

func NewExpenseService(db *mongo.Database) *ExpenseService {
	return &ExpenseService{
		collection: db.Collection("my-expenses"),
	}
}

func (s *ExpenseService) GetExpenses(ctx context.Context) ([]models.Expense, error) {
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

	cursor, err := s.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var expenses []models.Expense
	if err = cursor.All(ctx, &expenses); err != nil {
		return nil, err
	}

	return expenses, nil
}

func (s *ExpenseService) AddExpense(ctx context.Context, expense *models.Expense) error {
	_, err := s.collection.InsertOne(ctx, expense)
	return err
}

func (s *ExpenseService) UpdateExpense(ctx context.Context, updatedExpense *models.Expense, filter primitive.M) error {
	update := bson.M{"$set": updatedExpense}

	result, err := s.collection.UpdateOne(ctx, filter, update)
	if result.ModifiedCount == 0 {
		log.Println("No documents updated / Did not find the document to update")
		return mongo.ErrNoDocuments
	}

	return err
}

func (s *ExpenseService) DeleteExpenses(ctx context.Context, filter primitive.M) (int64, error) {
	// Implementation for deleting expenses
	result, err := s.collection.DeleteMany(ctx, filter)
	if err != nil {
		log.Println("Error deleting expenses:", err)
		return 0, err
	}
	return result.DeletedCount, nil

}
