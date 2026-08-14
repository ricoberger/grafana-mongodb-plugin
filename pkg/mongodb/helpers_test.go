package mongodb

import (
	"reflect"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

func TestFlattenDocument(t *testing.T) {
	tests := []struct {
		name     string
		document bson.M
		expected bson.M
	}{
		{
			name:     "empty document",
			document: bson.M{},
			expected: bson.M{},
		},
		{
			name: "flat document is unchanged",
			document: bson.M{
				"_id":        "6a4cad8eea14f073b66a98e8",
				"identifier": "spa-app",
				"basicAuth":  false,
				"order":      -1,
			},
			expected: bson.M{
				"_id":        "6a4cad8eea14f073b66a98e8",
				"identifier": "spa-app",
				"basicAuth":  false,
				"order":      -1,
			},
		},
		{
			name: "nested objects are flattened with dot separated keys",
			document: bson.M{
				"identifier": "spa-app",
				"oidcConfig": bson.M{
					"clientId":              "",
					"externalAttributeName": "email",
					"secret":                "",
				},
				"userOptions": bson.M{
					"allowUserCreation": false,
					"hasPublicEmail":    false,
				},
			},
			expected: bson.M{
				"identifier":                       "spa-app",
				"oidcConfig.clientId":              "",
				"oidcConfig.externalAttributeName": "email",
				"oidcConfig.secret":                "",
				"userOptions.allowUserCreation":    false,
				"userOptions.hasPublicEmail":       false,
			},
		},
		{
			name: "deeply nested objects are flattened recursively",
			document: bson.M{
				"a": bson.M{
					"b": bson.M{
						"c": "value",
					},
				},
			},
			expected: bson.M{
				"a.b.c": "value",
			},
		},
		{
			name: "arrays are flattened using their index",
			document: bson.M{
				"tags": bson.A{"one", "two"},
			},
			expected: bson.M{
				"tags.0": "one",
				"tags.1": "two",
			},
		},
		{
			name: "arrays of objects are flattened recursively",
			document: bson.M{
				"items": bson.A{
					bson.M{"name": "first"},
					bson.M{"name": "second"},
				},
			},
			expected: bson.M{
				"items.0.name": "first",
				"items.1.name": "second",
			},
		},
		{
			name: "empty nested object is kept as a leaf value",
			document: bson.M{
				"config": bson.M{},
			},
			expected: bson.M{
				"config": bson.M{},
			},
		},
		{
			name: "empty nested array is kept as a leaf value",
			document: bson.M{
				"tags": bson.A{},
			},
			expected: bson.M{
				"tags": bson.A{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FlattenDocument(tt.document)
			if !reflect.DeepEqual(result, tt.expected) {
				t.Errorf("FlattenDocument() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestStatsToRows(t *testing.T) {
	tests := []struct {
		name           string
		document       bson.M
		expectedStats  []string
		expectedValues []string
	}{
		{
			name:           "empty document",
			document:       bson.M{},
			expectedStats:  []string{},
			expectedValues: []string{},
		},
		{
			name: "rows are sorted alphabetically by stat name",
			document: bson.M{
				"storageSize": float64(2048),
				"collections": int32(3),
				"db":          "mydb",
			},
			expectedStats:  []string{"collections", "db", "storageSize"},
			expectedValues: []string{"3", "mydb", "2048"},
		},
		{
			name: "floats are formatted without scientific notation",
			document: bson.M{
				"dataSize":   float64(1234567),
				"avgObjSize": float64(1024.5),
			},
			expectedStats:  []string{"avgObjSize", "dataSize"},
			expectedValues: []string{"1024.5", "1234567"},
		},
		{
			name: "strings are emitted bare and booleans via fmt",
			document: bson.M{
				"db":     "test",
				"scaled": false,
			},
			expectedStats:  []string{"db", "scaled"},
			expectedValues: []string{"test", "false"},
		},
		{
			name: "nested values are flattened with dot separated keys",
			document: bson.M{
				"raw": bson.M{
					"total": int64(10),
				},
			},
			expectedStats:  []string{"raw.total"},
			expectedValues: []string{"10"},
		},
		{
			name: "command envelope metadata is stripped",
			document: bson.M{
				"db":          "mydb",
				"collections": int32(2),
				"ok":          float64(1),
				"operationTime": bson.M{
					"T": int64(1),
				},
				"$clusterTime": bson.M{
					"clusterTime": int64(1),
				},
			},
			expectedStats:  []string{"collections", "db"},
			expectedValues: []string{"2", "mydb"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stats, values := StatsToRows(tt.document)
			if !reflect.DeepEqual(stats, tt.expectedStats) {
				t.Errorf("StatsToRows() stats = %v, want %v", stats, tt.expectedStats)
			}
			if !reflect.DeepEqual(values, tt.expectedValues) {
				t.Errorf("StatsToRows() values = %v, want %v", values, tt.expectedValues)
			}
		})
	}
}
