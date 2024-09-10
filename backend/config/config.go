package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI             string
	Port                 string
	HUGGING_FACE_API_KEY string
}

func Load() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		return nil, err
	}

	return &Config{
		MongoURI:             os.Getenv("MONGODB_CONN_URI"),
		Port:                 os.Getenv("PORT"),
		HUGGING_FACE_API_KEY: os.Getenv("HUGGING_FACE_API_KEY"),
	}, nil
}
