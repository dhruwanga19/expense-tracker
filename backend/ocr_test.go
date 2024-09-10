package main

import (
	"bytes"
	"context"
	"io/ioutil"
	"strconv"
	"strings"
	"testing"

	vision "cloud.google.com/go/vision/apiv1"
	"github.com/dhruwanga19/expense-tracker/config"
)

func TestGoogleCloudVisionOCR(t *testing.T) {
	t.Log("Starting Google Cloud Vision OCR test")
	t.Log("Loading configs")
	// Load the environment variables
	_, err := config.Load()
	if err != nil {
		t.Fatal("Error loading configuration:", err)
	}

	// Create a client
	ctx := context.Background()
	client, err := vision.NewImageAnnotatorClient(ctx)
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Read the image file
	imagePath := "./images/groc_bill_2.jpeg"
	file, err := ioutil.ReadFile(imagePath)
	if err != nil {
		t.Fatalf("Failed to read image file: %v", err)
	}

	image, err := vision.NewImageFromReader(bytes.NewReader(file))
	if err != nil {
		t.Fatalf("Failed to create image: %v", err)
	}

	// Perform OCR
	annotations, err := client.DetectDocumentText(ctx, image, nil)
	if err != nil {
		t.Fatalf("Failed to detect document text: %v", err)
	}

	// Print the extracted text
	if annotations != nil {
		t.Log("Extracted text:\n")
		parseOCRResult(annotations.Text, t)
	} else {
		t.Fatal("No text detected")
	}

}

func parseOCRResult(text string, t *testing.T) {
	// This is a simple example. You might want to use more sophisticated
	// parsing techniques depending on your receipt format.
	// text := "Dumpster Org W/W Brd\nGreen Thai Chilis\nOreo Bark Chocolate\nGreen Peppers\nSub Total\n5.29\n8.99\n3.99\n6.34\n$18.27"
	lines := strings.Split(text, "\n")
	var items []struct {
		name  string
		price float64
	}
	var total float64
	midpoint := len(lines) / 2
	prices := lines[midpoint:]
	allItems := lines[:midpoint]
	t.Logf("Prices: %v", prices)
	t.Logf("Items: %v", allItems)

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

	t.Logf("Parsed Items:")
	for _, item := range items {
		t.Logf("  %s: %.2f", item.name, item.price)
	}
	t.Logf("Parsed Total: %.2f", total)

}
