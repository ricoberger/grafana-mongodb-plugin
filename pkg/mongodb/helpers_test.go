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
