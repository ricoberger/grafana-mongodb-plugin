import {
  CodeEditor,
  CodeEditorSuggestionItem,
  CodeEditorSuggestionItemKind,
  InlineField,
} from '@grafana/ui';
import React from 'react';

// Suggestions offered while editing a BSON document. The CodeEditor triggers
// completion on "$", so every label must start with "$". It covers the Extended
// JSON type wrappers (e.g. $oid, $date) as well as the common query operators.
const BSON_SUGGESTIONS: CodeEditorSuggestionItem[] = [
  {
    label: '$oid',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'ObjectId',
    documentation: '{ "$oid": "<24 character hex string>" }',
  },
  {
    label: '$date',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'Date',
    documentation:
      '{ "$date": "2006-01-02T15:04:05Z" } or { "$date": { "$numberLong": "<ms>" } }',
  },
  {
    label: '$numberInt',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: '32-bit integer',
    documentation: '{ "$numberInt": "<int>" }',
  },
  {
    label: '$numberLong',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: '64-bit integer',
    documentation: '{ "$numberLong": "<long>" }',
  },
  {
    label: '$numberDouble',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'Double',
    documentation: '{ "$numberDouble": "<double>" }',
  },
  {
    label: '$numberDecimal',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'Decimal128',
    documentation: '{ "$numberDecimal": "<decimal>" }',
  },
  {
    label: '$binary',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'Binary',
    documentation: '{ "$binary": { "base64": "<data>", "subType": "<hex>" } }',
  },
  {
    label: '$timestamp',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'Timestamp',
    documentation: '{ "$timestamp": { "t": <int>, "i": <int> } }',
  },
  {
    label: '$regularExpression',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'Regular expression',
    documentation:
      '{ "$regularExpression": { "pattern": "<regex>", "options": "<options>" } }',
  },
  {
    label: '$eq',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches values equal to a value',
  },
  {
    label: '$ne',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches values not equal to a value',
  },
  {
    label: '$gt',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches values greater than a value',
  },
  {
    label: '$gte',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches values greater than or equal to a value',
  },
  {
    label: '$lt',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches values less than a value',
  },
  {
    label: '$lte',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches values less than or equal to a value',
  },
  {
    label: '$in',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches any value in an array',
  },
  {
    label: '$nin',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches none of the values in an array',
  },
  {
    label: '$and',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Joins clauses with a logical AND',
  },
  {
    label: '$or',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Joins clauses with a logical OR',
  },
  {
    label: '$nor',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Joins clauses with a logical NOR',
  },
  {
    label: '$not',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Inverts the effect of a query expression',
  },
  {
    label: '$exists',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches documents that have the specified field',
  },
  {
    label: '$type',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches documents by BSON type',
  },
  {
    label: '$regex',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches values by regular expression',
  },
  {
    label: '$all',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches arrays that contain all elements',
  },
  {
    label: '$elemMatch',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches array elements that meet all criteria',
  },
  {
    label: '$size',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Matches arrays with the specified number of elements',
  },
  {
    label: '$expr',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Allows use of aggregation expressions within the query',
  },
];

interface Props {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

export function BsonEditor({ label, value, onChange }: Props) {
  return (
    <InlineField label={label} labelWidth={25}>
      <CodeEditor
        width={510}
        height={100}
        language="json"
        showLineNumbers={true}
        showMiniMap={false}
        value={value ?? ''}
        getSuggestions={() => BSON_SUGGESTIONS}
        onChange={onChange}
      />
    </InlineField>
  );
}
