package plugin

import (
	"context"
	"encoding/json"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/concurrent"
	"github.com/ricoberger/grafana-mongodb-plugin/pkg/models"
	"github.com/ricoberger/grafana-mongodb-plugin/pkg/mongodb"
	"go.mongodb.org/mongo-driver/bson"
)

func (d *Datasource) handleCollectionsQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleCollections, 10)
}

func (d *Datasource) handleCollections(ctx context.Context, query concurrent.Query) backend.DataResponse {
	collections, err := d.mongoClient.GetCollections(ctx)
	if err != nil {
		d.logger.Error("Failed to get collections", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	frame := data.NewFrame(
		"Collections",
		data.NewField("collections", nil, collections),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

func (d *Datasource) documentsToLogsFrame(name string, documents []bson.M, to time.Time) *data.Frame {
	var timestamps []time.Time
	var bodies []string
	var severities []string
	var labels []json.RawMessage
	for _, document := range documents {
		jsonDocument, err := bson.MarshalExtJSON(document, true, false)
		if err != nil {
			d.logger.Error("Failed to marshal document", "error", err.Error())
			continue
		}

		jsonLabels, err := json.Marshal(mongodb.FlattenDocument(document))
		if err != nil {
			d.logger.Error("Failed to marshal flattened document", "error", err.Error())
			continue
		}

		timestamps = append(timestamps, to)
		bodies = append(bodies, string(jsonDocument))
		severities = append(severities, "unknown")
		labels = append(labels, json.RawMessage(jsonLabels))
	}

	frame := data.NewFrame(
		name,
		data.NewField("timestamp", nil, timestamps),
		data.NewField("body", nil, bodies),
		data.NewField("severity", nil, severities),
		data.NewField("labels", nil, labels),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeLogs,
		Type:                   data.FrameTypeLogLines,
	})

	return frame
}

func (d *Datasource) handleFindQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleFind, 10)
}

func (d *Datasource) handleFind(ctx context.Context, query concurrent.Query) backend.DataResponse {
	var qm models.QueryModelFind
	err := json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
	}

	var response backend.DataResponse

	if qm.Explain {
		result, err := d.mongoClient.ExplainFind(ctx, qm.Collection, qm.Filter, qm.Sort, qm.Limit, qm.Verbosity)
		if err != nil {
			d.logger.Error("Failed to run explain find query", "error", err.Error())
			return backend.ErrorResponseWithErrorSource(err)
		}

		response.Frames = append(response.Frames, d.documentsToLogsFrame("Explain", []bson.M{result}, query.DataQuery.TimeRange.To))
		return response
	}

	documents, err := d.mongoClient.Find(ctx, qm.Collection, qm.Filter, qm.Sort, qm.Limit)
	if err != nil {
		d.logger.Error("Failed to run find query", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	response.Frames = append(response.Frames, d.documentsToLogsFrame("Documents", documents, query.DataQuery.TimeRange.To))
	return response
}

func (d *Datasource) handleCountQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleCount, 10)
}

func (d *Datasource) handleCount(ctx context.Context, query concurrent.Query) backend.DataResponse {
	var qm models.QueryModelCount
	err := json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
	}

	count, err := d.mongoClient.Count(ctx, qm.Collection, qm.Filter)
	if err != nil {
		d.logger.Error("Failed to run find query", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	frame := data.NewFrame(
		"Count",
		data.NewField("documents", nil, []int64{count}),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

func (d *Datasource) handleAggregateQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleAggregate, 10)
}

func (d *Datasource) handleAggregate(ctx context.Context, query concurrent.Query) backend.DataResponse {
	var qm models.QueryModelAggregate
	err := json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
	}

	var response backend.DataResponse

	if qm.Explain {
		result, err := d.mongoClient.ExplainAggregate(ctx, qm.Collection, qm.Pipeline, qm.Verbosity)
		if err != nil {
			d.logger.Error("Failed to run explain aggregate query", "error", err.Error())
			return backend.ErrorResponseWithErrorSource(err)
		}

		response.Frames = append(response.Frames, d.documentsToLogsFrame("Explain", []bson.M{result}, query.DataQuery.TimeRange.To))
		return response
	}

	documents, err := d.mongoClient.Aggregate(ctx, qm.Collection, qm.Pipeline)
	if err != nil {
		d.logger.Error("Failed to run aggregate query", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	response.Frames = append(response.Frames, d.documentsToLogsFrame("Documents", documents, query.DataQuery.TimeRange.To))
	return response
}

func (d *Datasource) handleDatabaseStatsQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleDatabaseStats, 10)
}

func (d *Datasource) handleDatabaseStats(ctx context.Context, query concurrent.Query) backend.DataResponse {
	stats, err := d.mongoClient.GetDBStats(ctx)
	if err != nil {
		d.logger.Error("Failed to get database stats", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	statNames, statValues := mongodb.StatsToRows(stats)

	frame := data.NewFrame(
		"Database Stats",
		data.NewField("stat", nil, statNames),
		data.NewField("value", nil, statValues),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

func (d *Datasource) handleCollectionStatsQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleCollectionStats, 10)
}

func (d *Datasource) handleCollectionStats(ctx context.Context, query concurrent.Query) backend.DataResponse {
	var qm models.QueryModelCollectionStats
	err := json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
	}

	stats, err := d.mongoClient.GetCollectionStats(ctx, qm.Collection)
	if err != nil {
		d.logger.Error("Failed to get collection stats", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	// The wiredTiger and indexDetails blocks contain verbose storage-engine
	// internals that would flatten into hundreds of rows, so they are stripped
	// unless the user explicitly opts in via the query editor.
	var stripFields []string
	if !qm.IncludeWiredTiger {
		stripFields = append(stripFields, "wiredTiger")
	}
	if !qm.IncludeIndexDetails {
		stripFields = append(stripFields, "indexDetails")
	}

	statNames, statValues := mongodb.StatsToRows(stats, stripFields...)

	frame := data.NewFrame(
		"Collection Stats",
		data.NewField("stat", nil, statNames),
		data.NewField("value", nil, statValues),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

func (d *Datasource) handleIndexesQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleIndexes, 10)
}

func (d *Datasource) handleIndexes(ctx context.Context, query concurrent.Query) backend.DataResponse {
	var qm models.QueryModelIndexStats
	err := json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
	}

	indexes, err := d.mongoClient.GetCollectionIndexes(ctx, qm.Collection)
	if err != nil {
		d.logger.Error("Failed to get collection indexes", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	names := make([]string, 0, len(indexes))
	for _, index := range indexes {
		if name, ok := index["name"].(string); ok {
			names = append(names, name)
		}
	}

	frame := data.NewFrame(
		"Indexes",
		data.NewField("indexes", nil, names),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

func (d *Datasource) handleIndexStatsQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleIndexStats, 10)
}

func (d *Datasource) handleIndexStats(ctx context.Context, query concurrent.Query) backend.DataResponse {
	var qm models.QueryModelIndexStats
	err := json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
	}

	indexStats, err := d.mongoClient.GetIndexStats(ctx, qm.Collection)
	if err != nil {
		d.logger.Error("Failed to get index stats", "error", err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	// $indexStats returns one document per index (and one per shard/host on
	// sharded clusters), so keep only the documents for the selected index.
	var matching []bson.M
	for _, document := range indexStats {
		if name, ok := document["name"].(string); ok && name == qm.Index {
			matching = append(matching, document)
		}
	}

	statNames, statValues := mongodb.StatsToRows(mongodb.IndexStatsDocument(matching))

	frame := data.NewFrame(
		"Index Stats",
		data.NewField("stat", nil, statNames),
		data.NewField("value", nil, statValues),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}
