import {
  CodeEditor,
  CodeEditorSuggestionItem,
  CodeEditorSuggestionItemKind,
  InlineField,
  type MonacoEditor,
} from '@grafana/ui';
import React, { useState } from 'react';

// Suggestions offered while editing a BSON document. The CodeEditor triggers
// completion on "$", so every label must start with "$". It covers the Extended
// JSON type wrappers (e.g. $oid, $date), the common query operators, the
// aggregation pipeline stages (e.g. $group, $sort, $project) and the accumulator
// operators used within a $group stage.
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
  {
    label: '$match',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: filters documents by a query',
    documentation: '{ "$match": { "<field>": <value> } }',
  },
  {
    label: '$group',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: groups documents by a key and accumulates values',
    documentation:
      '{ "$group": { "_id": "$<field>", "<name>": { "$sum": 1 } } }',
  },
  {
    label: '$sort',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: sorts documents',
    documentation: '{ "$sort": { "<field>": 1 } }',
  },
  {
    label: '$project',
    kind: CodeEditorSuggestionItemKind.Method,
    detail:
      'Pipeline stage: reshapes documents (include/exclude/compute fields)',
    documentation: '{ "$project": { "<field>": 1, "_id": 0 } }',
  },
  {
    label: '$limit',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: limits the number of documents',
    documentation: '{ "$limit": <number> }',
  },
  {
    label: '$skip',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: skips the first N documents',
    documentation: '{ "$skip": <number> }',
  },
  {
    label: '$count',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: counts documents into a named field',
    documentation: '{ "$count": "<field>" }',
  },
  {
    label: '$unwind',
    kind: CodeEditorSuggestionItemKind.Method,
    detail:
      'Pipeline stage: deconstructs an array field into one document per element',
    documentation: '{ "$unwind": "$<field>" }',
  },
  {
    label: '$lookup',
    kind: CodeEditorSuggestionItemKind.Method,
    detail:
      'Pipeline stage: performs a left outer join with another collection',
    documentation:
      '{ "$lookup": { "from": "<collection>", "localField": "<field>", "foreignField": "<field>", "as": "<field>" } }',
  },
  {
    label: '$addFields',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: adds new fields to documents',
    documentation: '{ "$addFields": { "<field>": <expression> } }',
  },
  {
    label: '$set',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: adds or overwrites fields (alias of $addFields)',
    documentation: '{ "$set": { "<field>": <expression> } }',
  },
  {
    label: '$unset',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: removes fields from documents',
    documentation: '{ "$unset": "<field>" }',
  },
  {
    label: '$replaceRoot',
    kind: CodeEditorSuggestionItemKind.Method,
    detail:
      'Pipeline stage: replaces the document with a specified sub-document',
    documentation: '{ "$replaceRoot": { "newRoot": "$<field>" } }',
  },
  {
    label: '$facet',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: runs multiple sub-pipelines in a single stage',
    documentation: '{ "$facet": { "<name>": [ <stage>, ... ] } }',
  },
  {
    label: '$sample',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Pipeline stage: randomly selects N documents',
    documentation: '{ "$sample": { "size": <number> } }',
  },
  {
    label: '$sum',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: returns the sum of values',
    documentation: '{ "$sum": 1 } or { "$sum": "$<field>" }',
  },
  {
    label: '$avg',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: returns the average of values',
    documentation: '{ "$avg": "$<field>" }',
  },
  {
    label: '$min',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: returns the minimum value',
    documentation: '{ "$min": "$<field>" }',
  },
  {
    label: '$max',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: returns the maximum value',
    documentation: '{ "$max": "$<field>" }',
  },
  {
    label: '$first',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: returns the value from the first document in a group',
    documentation: '{ "$first": "$<field>" }',
  },
  {
    label: '$last',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: returns the value from the last document in a group',
    documentation: '{ "$last": "$<field>" }',
  },
  {
    label: '$push',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: appends values into an array',
    documentation: '{ "$push": "$<field>" }',
  },
  {
    label: '$addToSet',
    kind: CodeEditorSuggestionItemKind.Method,
    detail: 'Accumulator: appends unique values into an array',
    documentation: '{ "$addToSet": "$<field>" }',
  },
];

interface Props {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

// The editor grows with its content, but stays within these bounds so it never
// collapses to nothing or takes over the whole query editor.
const MIN_HEIGHT = 32;
const MAX_HEIGHT = 500;

export function BsonEditor({ label, value, onChange }: Props) {
  const [height, setHeight] = useState(MIN_HEIGHT);

  const onEditorDidMount = (editor: MonacoEditor) => {
    const updateHeight = () => {
      const contentHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, editor.getContentHeight()),
      );
      setHeight(contentHeight);
    };

    editor.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  return (
    <InlineField label={label} labelWidth={25}>
      <CodeEditor
        width={720}
        height={height}
        language="json"
        showLineNumbers={true}
        showMiniMap={false}
        value={value ?? ''}
        monacoOptions={{ scrollBeyondLastLine: false }}
        getSuggestions={() => BSON_SUGGESTIONS}
        onEditorDidMount={onEditorDidMount}
        onBlur={onChange}
      />
    </InlineField>
  );
}
