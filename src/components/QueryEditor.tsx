import { QueryEditorProps } from '@grafana/data';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
  Input,
} from '@grafana/ui';
import React, { ChangeEvent } from 'react';

import { DataSource } from '../datasource';
import { DEFAULT_QUERIES, Options, Query, QueryType } from '../types';
import { CollectionField } from './CollectionField';

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
            width={50}
            value={query.queryType}
            options={[{ label: 'Find', value: 'find' }]}
            onChange={(option: ComboboxOption<QueryType>) => {
              onChange({
                ...query,
                ...DEFAULT_QUERIES[option.value],
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

      {query.queryType === 'find' && (
        <InlineFieldRow>
          <InlineField label="Filter" labelWidth={25}>
            <Input
              width={50}
              value={query.filter}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onChange({ ...query, filter: event.target.value });
              }}
            />
          </InlineField>
        </InlineFieldRow>
      )}

      {query.queryType === 'find' && (
        <InlineFieldRow>
          <InlineField label="Sort" labelWidth={25}>
            <Input
              width={50}
              value={query.sort}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onChange({ ...query, sort: event.target.value });
              }}
            />
          </InlineField>
        </InlineFieldRow>
      )}

      {query.queryType === 'find' && (
        <InlineFieldRow>
          <InlineField label="Limit" labelWidth={25}>
            <Input
              width={50}
              value={query.limit}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onChange({ ...query, limit: parseInt(event.target.value, 10) });
              }}
            />
          </InlineField>
        </InlineFieldRow>
      )}
    </>
  );
}
