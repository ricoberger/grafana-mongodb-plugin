package models

type QueryType string

const (
	QueryCollections = "collections"
	QueryFind        = "find"
)

type QueryModelFind struct {
	Collection string `json:"collection"`
	Filter     string `json:"filter"`
	Sort       string `json:"sort"`
	Limit      int64  `json:"limit"`
}
