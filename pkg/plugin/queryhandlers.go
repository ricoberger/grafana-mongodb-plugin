package plugin

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/concurrent"
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
