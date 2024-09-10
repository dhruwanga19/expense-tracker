package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Bill struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	FileName        string             `bson:"file_name" json:"fileName"`
	FileType        string             `bson:"file_type" json:"fileType"`
	UploadDate      time.Time          `bson:"upload_date" json:"uploadDate"`
	ProcessedDate   time.Time          `bson:"processed_date" json:"processedDate"`
	Status          string             `bson:"status" json:"status"` // e.g., "uploaded", "processing", "processed", "error"
	AnalysisResults struct {
		ExtractedText string  `bson:"extracted_text" json:"extractedText"`
		Total         float64 `bson:"total" json:"total"`
	} `bson:"analysis_results" json:"analysisResults"`
	GeneratedExpenses []Expense `bson:"generated_expenses" json:"generatedExpenses"`
}
