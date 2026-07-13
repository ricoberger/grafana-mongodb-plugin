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
		labels = append(labels, json.RawMessage(jsonLabels))
	}

	frame := data.NewFrame(
		name,
		data.NewField("timestamp", nil, timestamps),
		data.NewField("body", nil, bodies),
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
