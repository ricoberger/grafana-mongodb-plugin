import React, { ChangeEvent } from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

import { Options, OptionsSecure } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<
  Options,
  OptionsSecure
> { }

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  return (
    <>
      <InlineField label="Hosts" labelWidth={25} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                hosts: event.target.value,
              },
            });
          }}
          value={jsonData.hosts}
          width={40}
        />
      </InlineField>

      <InlineField label="Port" labelWidth={25} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                port: parseInt(event.target.value, 10),
              },
            });
          }}
          value={jsonData.port}
          width={40}
        />
      </InlineField>

      <InlineField label="Database" labelWidth={25} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                database: event.target.value,
              },
            });
          }}
          value={jsonData.database}
          width={40}
        />
      </InlineField>

      <InlineField label="Username" labelWidth={25} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                username: event.target.value,
              },
            });
          }}
          value={jsonData.username}
          width={40}
        />
      </InlineField>

      <InlineField label="Password" labelWidth={25} interactive>
        <SecretInput
          required
          isConfigured={secureJsonFields.password}
          value={secureJsonData?.password}
          width={40}
          onReset={() => {
            onOptionsChange({
              ...options,
              secureJsonFields: {
                ...options.secureJsonFields,
                password: false,
              },
              secureJsonData: {
                ...options.secureJsonData,
                password: '',
              },
            });
          }}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              secureJsonData: {
                password: event.target.value,
              },
            });
          }}
        />
      </InlineField>

      <InlineField label="Connection Options" labelWidth={25} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                connectionOptions: event.target.value,
              },
            });
          }}
          value={jsonData.connectionOptions}
          width={40}
        />
      </InlineField>
    </>
  );
}
