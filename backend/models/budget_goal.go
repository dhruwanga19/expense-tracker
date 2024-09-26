package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BudgetGoal struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	CategoryID primitive.ObjectID `bson:"category_id" json:"categoryId"`
	Amount     float64            `bson:"amount" json:"amount"`
	Period     string             `bson:"period" json:"period"`
	CreatedAt  time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updatedAt"`
}
