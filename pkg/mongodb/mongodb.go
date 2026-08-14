package mongodb

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"github.com/ricoberger/grafana-mongodb-plugin/pkg/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	mongoOptions "go.mongodb.org/mongo-driver/mongo/options"
)

type Client interface {
	Ping(ctx context.Context) error
	GetCollections(ctx context.Context) ([]string, error)
	GetDBStats(ctx context.Context) (bson.M, error)
	Find(ctx context.Context, collection string, filter string, sort string, limit int64) ([]bson.M, error)
	Count(ctx context.Context, collection string, filter string) (int64, error)
	Aggregate(ctx context.Context, collection, pipeline string) ([]bson.M, error)
	ExplainFind(ctx context.Context, collection string, filter string, sort string, limit int64, verbosity string) (bson.M, error)
	ExplainAggregate(ctx context.Context, collection, pipeline, verbosity string) (bson.M, error)
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

func (c *client) GetDBStats(ctx context.Context) (bson.M, error) {
	command := bson.D{
		{Key: "dbStats", Value: 1},
		{Key: "scale", Value: 1},
	}

	var result bson.M
	err := c.db.RunCommand(ctx, command).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (c *client) Find(ctx context.Context, collection string, filter string, sort string, limit int64) ([]bson.M, error) {
	var bsonFilter any
	err := bson.UnmarshalExtJSON([]byte(filter), false, &bsonFilter)
	if err != nil {
		return nil, err
	}

	var bsonSort any
	err = bson.UnmarshalExtJSON([]byte(sort), false, &bsonSort)
	if err != nil {
		return nil, err
	}

	cursor, err := c.db.Collection(collection).Find(ctx, bsonFilter, &mongoOptions.FindOptions{
		Limit: &limit,
		Skip:  nil,
		Sort:  bsonSort,
	})
	if err != nil {
		return nil, err
	}

	var results = make([]bson.M, 0)

	for cursor.Next(ctx) {
		var elem bson.M
		err := cursor.Decode(&elem)
		if err != nil {
			return nil, err
		}

		results = append(results, elem)
	}

	return results, nil
}

func (c *client) Count(ctx context.Context, collection string, filter string) (int64, error) {
	var bsonFilter any
	err := bson.UnmarshalExtJSON([]byte(filter), false, &bsonFilter)
	if err != nil {
		return 0, err
	}

	return c.db.Collection(collection).CountDocuments(ctx, bsonFilter)
}

func (c *client) Aggregate(ctx context.Context, collection, pipeline string) ([]bson.M, error) {
	var bsonPipeline any
	err := bson.UnmarshalExtJSON([]byte(pipeline), false, &bsonPipeline)
	if err != nil {
		return nil, err
	}

	cursor, err := c.db.Collection(collection).Aggregate(ctx, bsonPipeline)
	if err != nil {
		return nil, err
	}

	var results = make([]bson.M, 0)

	for cursor.Next(ctx) {
		var elem bson.M
		err := cursor.Decode(&elem)
		if err != nil {
			return nil, err
		}

		results = append(results, elem)
	}

	return results, nil
}

func (c *client) Disconnect(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}

const defaultExplainVerbosity = "queryPlanner"

func (c *client) ExplainFind(ctx context.Context, collection string, filter string, sort string, limit int64, verbosity string) (bson.M, error) {
	var bsonFilter any
	err := bson.UnmarshalExtJSON([]byte(filter), false, &bsonFilter)
	if err != nil {
		return nil, err
	}

	var bsonSort any
	err = bson.UnmarshalExtJSON([]byte(sort), false, &bsonSort)
	if err != nil {
		return nil, err
	}

	if verbosity == "" {
		verbosity = defaultExplainVerbosity
	}

	command := bson.D{
		{Key: "explain", Value: bson.D{
			{Key: "find", Value: collection},
			{Key: "filter", Value: bsonFilter},
			{Key: "sort", Value: bsonSort},
			{Key: "limit", Value: limit},
		}},
		{Key: "verbosity", Value: verbosity},
	}

	var result bson.M
	err = c.db.RunCommand(ctx, command).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (c *client) ExplainAggregate(ctx context.Context, collection, pipeline, verbosity string) (bson.M, error) {
	var bsonPipeline any
	err := bson.UnmarshalExtJSON([]byte(pipeline), false, &bsonPipeline)
	if err != nil {
		return nil, err
	}

	if verbosity == "" {
		verbosity = defaultExplainVerbosity
	}

	command := bson.D{
		{Key: "explain", Value: bson.D{
			{Key: "aggregate", Value: collection},
			{Key: "pipeline", Value: bsonPipeline},
			{Key: "cursor", Value: bson.D{}},
		}},
		{Key: "verbosity", Value: verbosity},
	}

	var result bson.M
	err = c.db.RunCommand(ctx, command).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func NewClient(ctx context.Context, settings *models.PluginSettings) (Client, error) {
	hosts := settings.Hosts
	if settings.Port != 0 {
		parts := strings.Split(settings.Hosts, ",")
		for i, h := range parts {
			if h = strings.TrimSpace(h); h != "" && !strings.Contains(h, ":") {
				h = fmt.Sprintf("%s:%d", h, settings.Port)
			}
			parts[i] = h
		}
		hosts = strings.Join(parts, ",")
	}

	uri := &url.URL{
		Scheme:   "mongodb",
		Host:     hosts,
		Path:     "/" + settings.Database,
		RawQuery: settings.ConnectionOptions,
	}

	// Only add credentials when a username is set (keeps no-auth working), and
	// let url encode any special characters in the password. Embedding the
	// credentials in the URI lets the driver derive authSource from the database
	// (and honor an authSource override in connectionOptions).
	if settings.Username != "" {
		uri.User = url.UserPassword(settings.Username, settings.Secrets.Password)
	}

	opts := mongoOptions.Client().ApplyURI(uri.String()).SetAppName("grafana-mongodb-plugin")
	if err := opts.Validate(); err != nil {
		return nil, err
	}

	mongoClient, err := mongo.Connect(ctx, opts)
	if err != nil {
		return nil, err
	}

	return &client{
		client: mongoClient,
		db:     mongoClient.Database(settings.Database),
	}, nil
}
