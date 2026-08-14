import { QueryEditorProps } from '@grafana/data';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
} from '@grafana/ui';
import React from 'react';

import { DataSource } from '../datasource';
import { DEFAULT_QUERIES, Options, Query, QueryType } from '../types';
import { CollectionField } from './CollectionField';

interface Props extends QueryEditorProps<DataSource, any, Options, Query> { }

export function VariableQueryEditor({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  return (
    <>
      <InlineFieldRow>
        <InlineField label="Variable Type" labelWidth={25}>
          <Combobox<QueryType>
            width={25}
            value={query.queryType}
            options={[
              {
                label: 'Collections',
                value: 'collections',
              },
              {
                label: 'Indexes',
                value: 'indexes',
              },
            ]}
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

      {query.queryType === 'indexes' && (
        <InlineFieldRow>
          <CollectionField
            datasource={datasource}
            collection={query.collection}
            onCollectionChange={(collection) => {
              onChange({ ...query, collection: collection });
              onRunQuery();
            }}
          />
        </InlineFieldRow>
      )}
    </>
  );
}
