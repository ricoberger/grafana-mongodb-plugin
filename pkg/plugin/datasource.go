package plugin

import (
	"context"

	"github.com/ricoberger/grafana-mongodb-plugin/pkg/models"
	"github.com/ricoberger/grafana-mongodb-plugin/pkg/mongodb"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin
// in runtime. In this example datasource instance implements
// backend.QueryDataHandler, backend.CheckHealthHandler interfaces. Plugin
// should not implement all these interfaces - only those which are required for
// a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

func NewDatasource(ctx context.Context, pCtx backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	logger := backend.Logger.With("datasource", pCtx.Name).With("datasourceId", pCtx.ID).With("datasourceUid", pCtx.UID)
	logger.Debug("Creating new datasource instance")

	settings, err := models.LoadPluginSettings(pCtx)
	if err != nil {
		logger.Error("Failed to load plugin settings", "error", err.Error())
		return nil, err
	}
	// logger.Debug("Plugin settings loaded successfully", "hosts", settings.Hosts, "port", settings.Port, "database", settings.Database, "username", settings.Username, "password", settings.Secrets.Password, "connectionOptions", settings.ConnectionOptions)

	mongoClient, err := mongodb.NewClient(ctx, settings)
	if err != nil {
		logger.Error("Failed to create MongoDB client", "error", err.Error())
		return nil, err
	}

	ds := &Datasource{
		mongoClient: mongoClient,
		logger:      logger,
	}

	queryTypeMux := datasource.NewQueryTypeMux()
	queryTypeMux.HandleFunc(models.QueryCollections, ds.handleCollectionsQueries)
	queryTypeMux.HandleFunc(models.QueryFind, ds.handleFindQueries)
	queryTypeMux.HandleFunc(models.QueryCount, ds.handleCountQueries)
	queryTypeMux.HandleFunc(models.QueryAggregate, ds.handleAggregateQueries)
	queryTypeMux.HandleFunc(models.QueryDatabaseStats, ds.handleDatabaseStatsQueries)
	queryTypeMux.HandleFunc(models.QueryCollectionStats, ds.handleCollectionStatsQueries)
	ds.queryHandler = queryTypeMux

	return ds, nil
}

// Datasource is an example datasource which can respond to data queries,
// reports its health and has streaming skills.
type Datasource struct {
	queryHandler backend.QueryDataHandler
	mongoClient  mongodb.Client
	logger       log.Logger
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a
// new instance created. As soon as datasource settings change detected by SDK
// old datasource instance will be disposed and a new one will be created using
// NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	err := d.mongoClient.Disconnect(context.Background())
	if err != nil {
		d.logger.Error("Failed to disconnect MongoDB client", "error", err.Error())
	}
}

// QueryData handles multiple queries and returns multiple responses. The
// queries are matched by their QueryType field against a handler function. See
// the NewDatasource function where the query type multiplexer is created and
// handlers are registered.
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return d.queryHandler.QueryData(ctx, req)
}

// CheckHealth handles health checks sent from Grafana to the plugin. The main
// use case for these health checks is the test button on the datasource
// configuration page which allows users to verify that a datasource is working
// as expected.
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	res := &backend.CheckHealthResult{}

	err := d.mongoClient.Ping(ctx)
	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = "Health check failed: " + err.Error()
		return res, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}
