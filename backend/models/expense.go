package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Expense struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Name       string             `bson:"name" json:"name"`
	Amount     float64            `bson:"amount" json:"amount"`
	Date       time.Time          `bson:"date" json:"date"`
	CategoryID primitive.ObjectID `bson:"category_id" json:"categoryId"`
	Category   *Category          `bson:"category,omitempty" json:"category,omitempty"`
}

type DeleteExpensesRequest struct {
	IDs []string `json:"ids"`
}
