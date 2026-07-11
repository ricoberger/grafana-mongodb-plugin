import { Combobox, ComboboxOption, InlineField } from '@grafana/ui';
import React from 'react';
import { useAsync } from 'react-use';

import { DataSource } from '../datasource';

interface Props {
  datasource: DataSource;
  collection?: string;
  onCollectionChange: (value: string) => void;
  isInline?: boolean;
}

export function CollectionField({
  datasource,
  collection,
  onCollectionChange,
}: Props) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    const result = await datasource.metricFindQuery({
      refId: 'collections',
      queryType: 'collections',
    });

    const zones = result.map((value) => {
      return { value: value.value as string, label: value.text };
    });
    return zones;
  }, [datasource]);

  return (
    <InlineField label="Collection" labelWidth={25}>
      <Combobox<string>
        width={50}
        value={collection}
        createCustomValue={true}
        options={state.value || []}
        onChange={(option: ComboboxOption<string>) => {
          onCollectionChange(option.value);
        }}
      />
    </InlineField>
  );
}
