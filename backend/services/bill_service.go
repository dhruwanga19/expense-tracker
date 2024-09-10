package services

import (
	"context"
	"fmt"
	"io"
	"log"
	"strconv"
	"strings"
	"time"

	vision "cloud.google.com/go/vision/apiv1"
	"github.com/dhruwanga19/expense-tracker/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BillService struct {
	billsCollection      *mongo.Collection
	expensesCollection   *mongo.Collection
	categoriesCollection *mongo.Collection
	visionClient         *vision.ImageAnnotatorClient
}

func NewBillService(db *mongo.Database) (*BillService, error) {
	ctx := context.Background()
	client, err := vision.NewImageAnnotatorClient(ctx)
	if err != nil {
		return nil, err
	}

	return &BillService{
		billsCollection:      db.Collection("bills"),
		expensesCollection:   db.Collection("my-expenses"),
		categoriesCollection: db.Collection("categories"),
		visionClient:         client,
	}, nil
}

func (s *BillService) CreateBill(ctx context.Context, fileName string, fileType string) (*models.Bill, error) {
	bill := &models.Bill{
		ID:         primitive.NewObjectID(),
		FileName:   fileName,
		FileType:   fileType,
		UploadDate: time.Now(),
		Status:     "uploaded",
	}

	result, err := s.billsCollection.InsertOne(ctx, bill)
	if err != nil {
		return nil, err
	}

	bill.ID = result.InsertedID.(primitive.ObjectID)
	return bill, nil
}

func (s *BillService) ProcessBill(ctx context.Context, billID primitive.ObjectID, fileContent io.Reader) error {
	// Start a session for the transaction
	log.Printf("Starting to process bill with ID: %s", billID.Hex())

	// Perform OCR
	image, err := vision.NewImageFromReader(fileContent)
	if err != nil {
		log.Printf("Error creating image from reader: %v", err)
		return fmt.Errorf("failed to create image: %v", err)
	}

	annotations, err := s.visionClient.DetectDocumentText(ctx, image, nil)
	if err != nil {
		log.Printf("Error detecting document text: %v", err)
		return fmt.Errorf("failed to detect document text: %v", err)
	}

	if annotations == nil {
		log.Println("No text detected in the image")
		return fmt.Errorf("no text detected in the image")
	}

	extractedText := annotations.Text
	log.Printf("Extracted text: %s", extractedText)

	// Parse OCR results
	expenses, total := s.parseOCRResult(extractedText)
	log.Printf("Parsed %d expenses, total amount: %f", len(expenses), total)

	// Convert expenses to the format we want to store in the database
	generatedExpenses := make([]models.Expense, len(expenses))
	for i, expense := range expenses {
		generatedExpenses[i] = models.Expense{
			Name:   expense.name,
			Amount: expense.price,
			Date:   time.Now(),
		}
	}

	// Update the bill with the processing results
	update := bson.M{
		"$set": bson.M{
			"status":         "processed",
			"processed_date": time.Now(),
			"analysis_results": bson.M{
				"extracted_text": extractedText,
				"total":          total,
			},
			"generated_expenses": generatedExpenses,
		},
	}

	_, err = s.billsCollection.UpdateOne(ctx, bson.M{"_id": billID}, update)
	if err != nil {
		log.Printf("Error updating bill: %v", err)
		return fmt.Errorf("failed to update bill: %v", err)
	}

	log.Println("Bill processed successfully")
	return nil

}

func (s *BillService) parseOCRResult(text string) ([]struct {
	name  string
	price float64
}, float64) {

	if text == "" {
		return nil, 0
	}

	lines := strings.Split(text, "\n")
	var items []struct {
		name  string
		price float64
	}
	var total float64 = 0

	midpoint := len(lines) / 2
	prices := lines[midpoint:]
	allItems := lines[:midpoint]

	for i, item := range allItems {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}

		price, err := strconv.ParseFloat(prices[i], 64)
		if err == nil {
			items = append(items, struct {
				name  string
				price float64
			}{item, price})

		} else {
			total, _ = strconv.ParseFloat(strings.TrimPrefix(prices[i], "$"), 64)
		}
	}

	return items, total
}

func (s *BillService) GetBill(ctx context.Context, billID primitive.ObjectID) (*models.Bill, error) {
	log.Printf("Getting bill with ID: %s", billID.Hex())
	var bill models.Bill
	err := s.billsCollection.FindOne(ctx, bson.M{"_id": billID}).Decode(&bill)
	if err != nil {
		log.Printf("Error getting bill in bill_service: %v", err)
		return nil, err
	}
	return &bill, nil
}

func (s *BillService) ConfirmExpenses(ctx context.Context, billID primitive.ObjectID, confirmedExpenses []models.Expense) error {
	log.Printf("Confirming expenses for bill ID: %s", billID.Hex())

	// Start a session for the transaction
	session, err := s.billsCollection.Database().Client().StartSession()
	if err != nil {
		log.Printf("Error starting session: %v", err)
		return err
	}
	defer session.EndSession(ctx)

	// Start a transaction
	err = session.StartTransaction()
	if err != nil {
		return err
	}

	// Use WithTransaction to handle commit and abort
	_, err = session.WithTransaction(ctx, func(sessCtx mongo.SessionContext) (interface{}, error) {
		// Update the bill with confirmed expenses
		_, err := s.billsCollection.UpdateOne(
			sessCtx,
			bson.M{"_id": billID},
			bson.M{"$set": bson.M{"generated_expenses": confirmedExpenses}},
		)
		if err != nil {
			return nil, err
		}

		// Add confirmed expenses to the expenses collection
		for _, expense := range confirmedExpenses {
			expense.ID = primitive.NewObjectID()
			_, err := s.expensesCollection.InsertOne(sessCtx, expense)
			if err != nil {
				return nil, err
			}
		}

		return nil, nil
	})

	return err
}
