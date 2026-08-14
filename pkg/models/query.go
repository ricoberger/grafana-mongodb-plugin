package models

type QueryType string

const (
	QueryCollections     = "collections"
	QueryFind            = "find"
	QueryCount           = "count"
	QueryAggregate       = "aggregate"
	QueryDatabaseStats   = "databasestats"
	QueryCollectionStats = "collectionstats"
)

type QueryModelFind struct {
	Collection string `json:"collection"`
	Filter     string `json:"filter"`
	Sort       string `json:"sort"`
	Limit      int64  `json:"limit"`
	Explain    bool   `json:"explain"`
	Verbosity  string `json:"verbosity"`
}

type QueryModelCount struct {
	Collection string `json:"collection"`
	Filter     string `json:"filter"`
}

type QueryModelAggregate struct {
	Collection string `json:"collection"`
	Pipeline   string `json:"pipeline"`
	Explain    bool   `json:"explain"`
	Verbosity  string `json:"verbosity"`
}

type QueryModelCollectionStats struct {
	Collection          string `json:"collection"`
	IncludeIndexDetails bool   `json:"includeIndexDetails"`
	IncludeWiredTiger   bool   `json:"includeWiredTiger"`
}
