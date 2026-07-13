package models

type QueryType string

const (
	QueryCollections = "collections"
	QueryFind        = "find"
	QueryCount       = "count"
	QueryAggregate   = "aggregate"
)

type QueryModelFind struct {
	Collection string `json:"collection"`
	Filter     string `json:"filter"`
	Sort       string `json:"sort"`
	Limit      int64  `json:"limit"`
}

type QueryModelCount struct {
	Collection string `json:"collection"`
	Filter     string `json:"filter"`
}

type QueryModelAggregate struct {
	Collection string `json:"collection"`
	Pipeline   string `json:"pipeline"`
}
