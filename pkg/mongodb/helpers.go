package mongodb

import (
	"fmt"
	"sort"
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

// dbStatsMetadataFields are top-level fields returned in the command envelope by
// RunCommand (rather than actual database statistics) that should not be shown
// to the user.
var dbStatsMetadataFields = map[string]struct{}{
	"ok":            {},
	"operationTime": {},
	"$clusterTime":  {},
}

// StatsToRows flattens the provided document and returns two parallel slices
// representing a two-column table: the stat names (dot-separated for nested
// values) and their string values. Command-envelope metadata (e.g. "ok" or
// "$clusterTime") is stripped, and the rows are sorted alphabetically by stat
// name so the resulting table stays stable across refreshes even though the
// underlying document is an unordered map.
func StatsToRows(document bson.M) ([]string, []string) {
	filtered := make(bson.M, len(document))
	for key, value := range document {
		if _, isMetadata := dbStatsMetadataFields[key]; isMetadata {
			continue
		}
		filtered[key] = value
	}

	flattened := FlattenDocument(filtered)

	stats := make([]string, 0, len(flattened))
	for key := range flattened {
		stats = append(stats, key)
	}
	sort.Strings(stats)

	values := make([]string, 0, len(stats))
	for _, stat := range stats {
		values = append(values, valueToString(flattened[stat]))
	}

	return stats, values
}

// valueToString converts a (already flattened) value into a string suitable for
// display in a table cell. Floats are formatted without scientific notation so
// large byte counts stay readable, strings are emitted bare, and any remaining
// types fall back to fmt's default formatting.
func valueToString(value any) string {
	switch v := value.(type) {
	case nil:
		return ""
	case string:
		return v
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case float32:
		return strconv.FormatFloat(float64(v), 'f', -1, 32)
	default:
		return fmt.Sprintf("%v", v)
	}
}
