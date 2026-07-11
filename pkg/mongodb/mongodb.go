package mongodb

import (
	"context"
	"net/url"

	"github.com/ricoberger/grafana-mongodb-plugin/pkg/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	mongoOptions "go.mongodb.org/mongo-driver/mongo/options"
)

type Client interface {
	Ping(ctx context.Context) error
	GetCollections(ctx context.Context) ([]string, error)
	Disconnect(ctx context.Context) error
}

type client struct {
	client *mongo.Client
	db     *mongo.Database
}

func (c *client) Ping(ctx context.Context) error {
	return c.client.Ping(ctx, nil)
}

func (c *client) GetCollections(ctx context.Context) ([]string, error) {
	collections, err := c.db.ListCollectionNames(ctx, bson.D{})
	if err != nil {
		return nil, err
	}

	return collections, nil
}

func (c *client) Disconnect(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}

func NewClient(ctx context.Context, settings *models.PluginSettings) (Client, error) {
	uri := &url.URL{
		Host:     settings.Hosts,
		Path:     settings.Database,
		Scheme:   "mongodb://",
		RawQuery: settings.ConnectionOptions,
	}

	opts := mongoOptions.Client().ApplyURI(uri.String()).SetAppName("grafana-mongodb-plugin")
	opts.SetAuth(mongoOptions.Credential{
		Username: settings.Username,
		Password: settings.Secrets.Password,
	})

	mongoClient, err := mongo.Connect(ctx, opts)
	if err != nil {
		return nil, err
	}

	return &client{
		client: mongoClient,
		db:     mongoClient.Database(settings.Database),
	}, nil
}
