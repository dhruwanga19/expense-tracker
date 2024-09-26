package utils

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectDB(uri string) (*mongo.Database, error) {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	log.Println("Connected to MongoDB")
	return client.Database("expenses"), nil
}

func DisconnectDB(db *mongo.Database) {
	if err := db.Client().Disconnect(context.Background()); err != nil {
		panic(err)
	}
}
