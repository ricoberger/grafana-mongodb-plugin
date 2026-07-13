import {
  CodeEditor,
  InlineField,
  type Monaco,
  type MonacoEditor,
  type monacoTypes,
} from '@grafana/ui';
import React, { useRef, useState } from 'react';

import { registerMongoCompletion } from './completion';

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
  const completion = useRef<monacoTypes.IDisposable | null>(null);

  // Queries are written in MongoDB shell / Extended JSON syntax and only
  // converted to strict Extended JSON before they are sent to the backend (see
  // datasource.ts). Using the JavaScript language gives proper highlighting for
  // that syntax (helpers such as ObjectId(...) / ISODate(...), single-quoted
  // strings and comments) while keeping the "$" auto-completion. A bare object
  // literal is however not a valid JavaScript statement, so the language service
  // is told not to report syntax/semantic problems to avoid flagging perfectly
  // valid input as errors.
  const onBeforeEditorMount = (monaco: Monaco) => {
    const jsDefaults = monaco.languages.typescript.javascriptDefaults;

    jsDefaults.setDiagnosticsOptions({
      noSyntaxValidation: true,
      noSemanticValidation: true,
      noSuggestionDiagnostics: true,
    });

    // Drop the default JavaScript libraries so their globals (e.g. Array,
    // AbortSignal, fetch) are not offered as completions — they are not valid
    // query input. Type information is unused here since diagnostics are off.
    // The MongoDB operator/helper completion registered in onEditorDidMount is a
    // separate provider and keeps working.
    jsDefaults.setCompilerOptions({
      ...jsDefaults.getCompilerOptions(),
      noLib: true,
    });
  };

  const onEditorDidMount = (editor: MonacoEditor, monaco: Monaco) => {
    // Register the MongoDB operator completion. Providers are global, so the
    // disposable is released in onEditorWillUnmount to avoid leaking one per
    // mounted editor.
    completion.current = registerMongoCompletion(editor, monaco);

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

  const onEditorWillUnmount = () => {
    completion.current?.dispose();
    completion.current = null;
  };

  return (
    <InlineField label={label} labelWidth={25}>
      <CodeEditor
        width={720}
        height={height}
        language="javascript"
        showLineNumbers={true}
        showMiniMap={false}
        value={value ?? ''}
        monacoOptions={{ scrollBeyondLastLine: false }}
        onBeforeEditorMount={onBeforeEditorMount}
        onEditorDidMount={onEditorDidMount}
        onEditorWillUnmount={onEditorWillUnmount}
        onBlur={onChange}
      />
    </InlineField>
  );
}
