package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Bill struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	FileName string             `bson:"file_name" json:"fileName"`
	FilePath string             `bson:"file_path" json:"filePath"`
	Text     string             `bson:"text" json:"text"`
	Expenses []Expense          `bson:"expenses" json:"expenses"`
}
