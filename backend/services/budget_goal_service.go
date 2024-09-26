package services

import (
	"context"
	"time"

	"github.com/dhruwanga19/expense-tracker/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BudgetGoalService struct {
	collection *mongo.Collection
}

func NewBudgetGoalService(db *mongo.Database) *BudgetGoalService {
	return &BudgetGoalService{
		collection: db.Collection("budget_goals"),
	}
}

func (s *BudgetGoalService) CreateBudgetGoal(ctx context.Context, goal *models.BudgetGoal) error {
	goal.CreatedAt = time.Now()
	goal.UpdatedAt = time.Now()
	_, err := s.collection.InsertOne(ctx, goal)
	return err
}

func (s *BudgetGoalService) GetBudgetGoals(ctx context.Context) ([]models.BudgetGoal, error) {
	cursor, err := s.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var goals []models.BudgetGoal
	if err = cursor.All(ctx, &goals); err != nil {
		return nil, err
	}
	return goals, nil
}

func (s *BudgetGoalService) UpdateBudgetGoal(ctx context.Context, goal *models.BudgetGoal) error {
	goal.UpdatedAt = time.Now()
	filter := bson.M{"_id": goal.ID}
	update := bson.M{"$set": goal}
	_, err := s.collection.UpdateOne(ctx, filter, update)
	return err
}

func (s *BudgetGoalService) DeleteBudgetGoal(ctx context.Context, id primitive.ObjectID) error {
	_, err := s.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
