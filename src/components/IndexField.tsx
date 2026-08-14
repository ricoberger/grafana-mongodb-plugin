import { Combobox, ComboboxOption, InlineField } from '@grafana/ui';
import React from 'react';
import { useAsync } from 'react-use';

import { DataSource } from '../datasource';

interface Props {
  datasource: DataSource;
  collection?: string;
  index?: string;
  onIndexChange: (value: string) => void;
}

export function IndexField({
  datasource,
  collection,
  index,
  onIndexChange,
}: Props) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    if (!collection) {
      return [];
    }

    const result = await datasource.metricFindQuery({
      refId: 'indexes',
      queryType: 'indexes',
      collection: collection,
    });

    return result.map((value) => {
      return { value: value.value as string, label: value.text };
    });
  }, [datasource, collection]);

  return (
    <InlineField label="Index" labelWidth={25}>
      <Combobox<string>
        width={90}
        value={index}
        createCustomValue={true}
        options={state.value || []}
        onChange={(option: ComboboxOption<string>) => {
          onIndexChange(option.value);
        }}
      />
    </InlineField>
  );
}
