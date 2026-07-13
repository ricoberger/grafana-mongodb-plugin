import { QueryEditorProps } from '@grafana/data';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
} from '@grafana/ui';
import React, { ChangeEvent, FormEvent } from 'react';

import { DataSource } from '../datasource';
import {
  DEFAULT_QUERIES,
  Options,
  Query,
  QueryType,
  Verbosity,
} from '../types';
import { CollectionField } from './CollectionField';
import { BsonEditor } from './editor/BsonEditor';

type Props = QueryEditorProps<DataSource, Query, Options>;

export function QueryEditor({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query Type" labelWidth={25}>
          <Combobox<QueryType>
            width={90}
            value={query.queryType}
            options={[
              { label: 'Find', value: 'find' },
              { label: 'Count', value: 'count' },
              { label: 'Aggregate', value: 'aggregate' },
            ]}
            onChange={(option: ComboboxOption<QueryType>) => {
              onChange({
                ...query,
                ...DEFAULT_QUERIES[option.value],
                collection: query.collection,
                queryType: option.value,
              });
              onRunQuery();
            }}
          />
        </InlineField>
      </InlineFieldRow>

      <InlineFieldRow>
        <CollectionField
          datasource={datasource}
          collection={query.collection}
          onCollectionChange={(collection) => {
            onChange({
              ...query,
              collection: collection,
            });
            onRunQuery();
          }}
        />
      </InlineFieldRow>

      {(query.queryType === 'find' || query.queryType === 'count') && (
        <InlineFieldRow>
          <BsonEditor
            label="Filter"
            value={query.filter}
            onChange={(value) => {
              onChange({ ...query, filter: value });
            }}
          />
        </InlineFieldRow>
      )}

      {query.queryType === 'find' && (
        <InlineFieldRow>
          <BsonEditor
            label="Sort"
            value={query.sort}
            onChange={(value) => {
              onChange({ ...query, sort: value });
            }}
          />
        </InlineFieldRow>
      )}

      {query.queryType === 'find' && (
        <InlineFieldRow>
          <InlineField label="Limit" labelWidth={25}>
            <Input
              width={90}
              value={query.limit}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onChange({ ...query, limit: parseInt(event.target.value, 10) });
              }}
            />
          </InlineField>
        </InlineFieldRow>
      )}

      {query.queryType === 'aggregate' && (
        <InlineFieldRow>
          <BsonEditor
            label="Pipeline"
            value={query.pipeline}
            onChange={(value) => {
              onChange({ ...query, pipeline: value });
            }}
          />
        </InlineFieldRow>
      )}

      {(query.queryType === 'find' || query.queryType === 'aggregate') && (
        <InlineFieldRow>
          <InlineField label="Explain" labelWidth={25}>
            <InlineSwitch
              value={query.explain ?? false}
              onChange={(event: FormEvent<HTMLInputElement>) => {
                onChange({
                  ...query,
                  explain: event.currentTarget.checked,
                  verbosity: query.verbosity ?? 'queryPlanner',
                });
                onRunQuery();
              }}
            />
          </InlineField>
        </InlineFieldRow>
      )}

      {(query.queryType === 'find' || query.queryType === 'aggregate') &&
        query.explain && (
          <InlineFieldRow>
            <InlineField label="Verbosity" labelWidth={25}>
              <Combobox<Verbosity>
                width={90}
                value={query.verbosity ?? 'queryPlanner'}
                options={[
                  { label: 'Query Planner', value: 'queryPlanner' },
                  { label: 'Execution Stats', value: 'executionStats' },
                  { label: 'All Plans Execution', value: 'allPlansExecution' },
                ]}
                onChange={(option: ComboboxOption<Verbosity>) => {
                  onChange({ ...query, verbosity: option.value });
                  onRunQuery();
                }}
              />
            </InlineField>
          </InlineFieldRow>
        )}
    </>
  );
}
