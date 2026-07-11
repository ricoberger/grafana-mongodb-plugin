package models

type QueryType string

const (
	QueryCollections = "collections"
	QueryFind        = "find"
	QueryAggregate   = "aggregate"
)

type QueryModelFind struct {
	Collection string `json:"collection"`
	Filter     string `json:"filter"`
	Sort       string `json:"sort"`
	Limit      int64  `json:"limit"`
}

type QueryModelAggregate struct {
	Collection string `json:"collection"`
	Pipeline   string `json:"pipeline"`
}
