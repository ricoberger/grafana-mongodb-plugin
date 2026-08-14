import { GrafanaTheme2, QueryEditorProps } from '@grafana/data';
import {
  Alert,
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
  useStyles2,
} from '@grafana/ui';
import React, { ChangeEvent, FormEvent } from 'react';

import { css } from '@emotion/css';
import { DataSource } from '../datasource';
import { getMissingRequiredFields } from '../query';
import {
  DEFAULT_QUERIES,
  Options,
  Query,
  QueryType,
  Verbosity,
} from '../types';
import { CollectionField } from './CollectionField';
import { IndexField } from './IndexField';
import { BsonEditor } from './editor/BsonEditor';

type Props = QueryEditorProps<DataSource, Query, Options>;

export function QueryEditor({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  const styles = useStyles2((theme: GrafanaTheme2) => ({
    marginTop: css`
      margin-top: ${theme.spacing(2)};
    `,
  }));
  const missingFields = getMissingRequiredFields(query);

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
              { label: 'Database Stats', value: 'databasestats' },
              { label: 'Collection Stats', value: 'collectionstats' },
              { label: 'Index Stats', value: 'indexstats' },
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

      {query.queryType !== 'databasestats' && (
        <InlineFieldRow>
          <CollectionField
            datasource={datasource}
            collection={query.collection}
            onCollectionChange={(collection) => {
              onChange({
                ...query,
                collection: collection,
                // Changing the collection invalidates a previously selected
                // index, so clear it for the index stats query type.
                ...(query.queryType === 'indexstats' ? { index: '' } : {}),
              });
              onRunQuery();
            }}
          />
        </InlineFieldRow>
      )}

      {query.queryType === 'indexstats' && (
        <InlineFieldRow>
          <IndexField
            datasource={datasource}
            collection={query.collection}
            index={query.index}
            onIndexChange={(index) => {
              onChange({ ...query, index: index });
              onRunQuery();
            }}
          />
        </InlineFieldRow>
      )}

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

      {query.queryType === 'collectionstats' && (
        <>
          <InlineFieldRow>
            <InlineField label="Include Index Details" labelWidth={25}>
              <InlineSwitch
                value={query.includeIndexDetails ?? false}
                onChange={(event: FormEvent<HTMLInputElement>) => {
                  onChange({
                    ...query,
                    includeIndexDetails: event.currentTarget.checked,
                  });
                  onRunQuery();
                }}
              />
            </InlineField>
          </InlineFieldRow>

          <InlineFieldRow>
            <InlineField label="Include WiredTiger" labelWidth={25}>
              <InlineSwitch
                value={query.includeWiredTiger ?? false}
                onChange={(event: FormEvent<HTMLInputElement>) => {
                  onChange({
                    ...query,
                    includeWiredTiger: event.currentTarget.checked,
                  });
                  onRunQuery();
                }}
              />
            </InlineField>
          </InlineFieldRow>
        </>
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

      {missingFields.length > 0 && (
        <div className={styles.marginTop}>
          <Alert title="Missing required fields" severity="warning">
            The query will not run until the following required field
            {missingFields.length > 1 ? 's are' : ' is'} set:{' '}
            {missingFields.join(', ')}.
          </Alert>
        </div>
      )}
    </>
  );
}
