package mongodb

import (
	"strconv"

	"go.mongodb.org/mongo-driver/bson"
)

// flattenDocument returns a copy of the provided document where nested objects
// and arrays are flattened into a single-level map using dot-separated keys
// (e.g. "oidcConfig.clientId"). This makes the values usable as Grafana labels,
// which only support a flat set of key-value pairs.
func FlattenDocument(document bson.M) bson.M {
	result := make(bson.M)
	for key, value := range document {
		flattenValue(key, value, result)
	}
	return result
}

func flattenValue(prefix string, value any, result bson.M) {
	switch v := value.(type) {
	case bson.M:
		if len(v) == 0 {
			result[prefix] = v
			return
		}
		for key, val := range v {
			flattenValue(joinKey(prefix, key), val, result)
		}
	case bson.A:
		if len(v) == 0 {
			result[prefix] = v
			return
		}
		for i, val := range v {
			flattenValue(joinKey(prefix, strconv.Itoa(i)), val, result)
		}
	default:
		result[prefix] = v
	}
}

func joinKey(prefix, key string) string {
	if prefix == "" {
		return key
	}
	return prefix + "." + key
}
