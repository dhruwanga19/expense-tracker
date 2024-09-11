package services

import (
	"context"
	"fmt"
	"io"
	"log"
	"regexp"
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
	for _, expense := range expenses {
		log.Printf("Expense: %s, Price: %f", expense.name, expense.price)
	}

	// Convert expenses to the format we want to store in the database
	generatedExpenses := make([]models.Expense, len(expenses))
	for i, expense := range expenses {
		generatedExpenses[i] = models.Expense{
			ID:     primitive.NewObjectID(),
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
	var currentExpense struct {
		name  string
		price float64
	}

	// Regular expressions for matching expense names and prices
	nameRegex := regexp.MustCompile(`^[A-Za-z][A-Za-z0-9\s/]+`)
	priceRegex := regexp.MustCompile(`^(\$)?(\d+\.\d{2})([\s\S]*)?$`)

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if nameRegex.MatchString(line) {

			// If we have a previous expense with a price, add it to the list
			if currentExpense.name != "" && currentExpense.price != 0 {
				items = append(items, currentExpense)
				total += currentExpense.price
			}
			currentExpense.name = line
		} else if priceMatch := priceRegex.FindStringSubmatch(line); priceMatch != nil {
			price, err := strconv.ParseFloat(priceMatch[2], 64)
			if err == nil && currentExpense.name != "" {
				currentExpense.price = price
			}
		}
	}

	// Add the last expense if it exists
	if currentExpense.name != "" && currentExpense.price != 0 {
		items = append(items, currentExpense)
		total += currentExpense.price
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

func (s *BillService) UpdateBillExpense(ctx context.Context, billID, expenseID primitive.ObjectID, updatedExpense *models.Expense) error {

	filter := bson.M{"_id": billID, "generated_expenses._id": expenseID}
	update := bson.M{
		"$set": bson.M{
			"generated_expenses.$": updatedExpense,
		},
	}

	result, err := s.billsCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("no expense found with id %s in bill %s", expenseID.Hex(), billID.Hex())
	}

	return nil
}

func (s *BillService) ConfirmExpenses(ctx context.Context, billID primitive.ObjectID, expenses []models.Expense) error {
	session, err := s.billsCollection.Database().Client().StartSession()
	if err != nil {
		log.Printf("Error starting session: %v", err)
		return err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sessCtx mongo.SessionContext) (interface{}, error) {
		// Get the bill
		var bill models.Bill
		err := s.billsCollection.FindOne(sessCtx, bson.M{"_id": billID}).Decode(&bill)
		if err != nil {
			log.Printf("Error finding bill: %v", err)
			return nil, err
		}

		// Validate and process expenses
		for i, expense := range expenses {
			if expense.CategoryID == primitive.NilObjectID {
				return nil, fmt.Errorf("expense %d is missing a category", i+1)
			}

			if expense.ID.IsZero() {
				// This is a new expense, generate a new ID
				expenses[i].ID = primitive.NewObjectID()
			}

			_, err := s.expensesCollection.InsertOne(sessCtx, expenses[i])
			if err != nil {
				log.Printf("Error inserting expense: %v", err)
				return nil, err
			}
		}

		// Update the bill with confirmed expenses and status
		_, err = s.billsCollection.UpdateOne(
			sessCtx,
			bson.M{"_id": billID},
			bson.M{
				"$set": bson.M{
					"status":             "confirmed",
					"generated_expenses": expenses,
				},
			},
		)
		if err != nil {
			log.Printf("Error updating bill status: %v", err)
			return nil, err
		}

		return nil, nil
	})

	if err != nil {
		log.Printf("Transaction failed: %v", err)
		return fmt.Errorf("failed to confirm expenses: %v", err)
	}

	log.Println("Expenses confirmed successfully")
	return nil
}
