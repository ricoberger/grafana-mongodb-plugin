import { type Monaco, type MonacoEditor, type monacoTypes } from '@grafana/ui';
import {
  ACCUMULATORS,
  CONVERSION_OPERATORS,
  EXPRESSION_OPERATORS,
  QUERY_OPERATORS,
  STAGE_OPERATORS,
} from '@mongodb-js/mongodb-constants';

// Minimal shape shared by every operator metadata object. Only stage operators
// carry a `snippet` and `description`; the other categories expose just the
// name and a `meta` category.
interface MongoOperator {
  name: string;
  meta: string;
  description?: string;
  snippet?: string;
}

// Extended JSON type wrappers (https://www.mongodb.com/docs/manual/reference/mongodb-extended-json).
// These are not part of @mongodb-js/mongodb-constants, so they are declared
// here to keep them available in the completion list.
const EJSON_TYPE_WRAPPERS: readonly MongoOperator[] = [
  {
    name: '$oid',
    meta: 'bson',
    description: 'ObjectId',
    snippet: '"${1:24 character hex string}"',
  },
  {
    name: '$date',
    meta: 'bson',
    description: 'Date (ISO-8601 string or { "$numberLong": "<ms>" })',
    snippet: '"${1:2006-01-02T15:04:05Z}"',
  },
  {
    name: '$numberInt',
    meta: 'bson',
    description: '32-bit integer',
    snippet: '"${1:int}"',
  },
  {
    name: '$numberLong',
    meta: 'bson',
    description: '64-bit integer',
    snippet: '"${1:long}"',
  },
  {
    name: '$numberDouble',
    meta: 'bson',
    description: 'Double',
    snippet: '"${1:double}"',
  },
  {
    name: '$numberDecimal',
    meta: 'bson',
    description: 'Decimal128',
    snippet: '"${1:decimal}"',
  },
  {
    name: '$binary',
    meta: 'bson',
    description: 'Binary',
    snippet: '{ "base64": "${1:data}", "subType": "${2:hex}" }',
  },
  {
    name: '$timestamp',
    meta: 'bson',
    description: 'Timestamp',
    snippet: '{ "t": ${1:0}, "i": ${2:0} }',
  },
  {
    name: '$regularExpression',
    meta: 'bson',
    description: 'Regular expression',
    snippet: '{ "pattern": "${1:regex}", "options": "${2:options}" }',
  },
];

// All operators offered while editing a query: the Extended JSON type wrappers
// plus the aggregation stages, the query/expression operators, the accumulators
// and the type conversion operators from the official MongoDB metadata.
const OPERATORS = [
  ...EJSON_TYPE_WRAPPERS,
  ...STAGE_OPERATORS,
  ...EXPRESSION_OPERATORS,
  ...ACCUMULATORS,
  ...CONVERSION_OPERATORS,
  ...QUERY_OPERATORS,
] as readonly MongoOperator[];

// MongoDB shell constructor helpers accepted by mongodb-query-parser. Unlike the
// operators (which are object keys) these appear in value position, e.g.
// `{ _id: ObjectId("...") }`, and are inserted as function-call snippets.
interface ShellHelper {
  label: string;
  detail: string;
  insertText: string;
}

const SHELL_HELPERS: readonly ShellHelper[] = [
  {
    label: 'ObjectId',
    detail: 'ObjectId',
    insertText: 'ObjectId("${1:hex string}")',
  },
  {
    label: 'ISODate',
    detail: 'Date',
    insertText: 'ISODate("${1:2006-01-02T15:04:05Z}")',
  },
  { label: 'Date', detail: 'Date', insertText: 'Date("${1:2006-01-02}")' },
  {
    label: 'NumberLong',
    detail: '64-bit integer',
    insertText: 'NumberLong("${1:value}")',
  },
  {
    label: 'NumberInt',
    detail: '32-bit integer',
    insertText: 'NumberInt("${1:value}")',
  },
  {
    label: 'NumberDecimal',
    detail: 'Decimal128',
    insertText: 'NumberDecimal("${1:value}")',
  },
  { label: 'Double', detail: 'Double', insertText: 'Double(${1:value})' },
  {
    label: 'Timestamp',
    detail: 'Timestamp',
    insertText: 'Timestamp(${1:t}, ${2:i})',
  },
  {
    label: 'BinData',
    detail: 'Binary',
    insertText: 'BinData(${1:subType}, "${2:base64}")',
  },
  { label: 'UUID', detail: 'UUID', insertText: 'UUID("${1:uuid}")' },
  { label: 'MinKey', detail: 'MinKey', insertText: 'MinKey()' },
  { label: 'MaxKey', detail: 'MaxKey', insertText: 'MaxKey()' },
  {
    label: 'DBRef',
    detail: 'DBRef',
    insertText: 'DBRef("${1:collection}", "${2:id}")',
  },
  { label: 'Code', detail: 'Code', insertText: 'Code("${1:code}")' },
  {
    label: 'RegExp',
    detail: 'Regular expression',
    insertText: 'RegExp("${1:pattern}", "${2:options}")',
  },
];

class MongoCompletionProvider
  implements monacoTypes.languages.CompletionItemProvider {
  // "$" opens the operator completion; shell helpers are offered through the
  // editor's quick suggestions as the identifier is typed.
  triggerCharacters = ['$'];

  constructor(
    private readonly editor: MonacoEditor,
    private readonly monaco: Monaco,
  ) { }

  provideCompletionItems(
    model: monacoTypes.editor.ITextModel,
    position: monacoTypes.Position,
  ): monacoTypes.languages.ProviderResult<monacoTypes.languages.CompletionList> {
    // Providers are registered globally per language, so only answer for the
    // model backing this editor instance. Without this guard every BsonEditor
    // on the page (filter, sort, pipeline) would contribute duplicate items.
    if (this.editor.getModel()?.id !== model.id) {
      return { suggestions: [] };
    }

    const word = model.getWordUntilPosition(position);
    let startColumn = word.startColumn;
    const wordStartOffset = model.getOffsetAt({
      lineNumber: position.lineNumber,
      column: word.startColumn,
    });

    // Text preceding the word being typed. Depending on the tokenizer the "$"
    // may or may not be part of the word, so normalise both cases: strip a
    // trailing "$" and grow the replaced range to include it.
    let before = model.getValue().slice(0, wordStartOffset);
    if (before.endsWith('$')) {
      before = before.slice(0, -1);
      startColumn -= 1;
    }

    const trimmed = before.replace(/\s+$/, '');
    const lastChar = trimmed.slice(-1);
    const inString = lastChar === '"' || lastChar === "'";

    // Key position: right after "{" or ",". The key may be unquoted (mongo
    // shell, `{ $x`) or quoted (Extended JSON, `{ "$x"`), so an opening
    // key-quote is transparent. Operators are only valid here.
    let keyAnchor = trimmed;
    const quotedKey = inString;
    if (quotedKey) {
      keyAnchor = trimmed.slice(0, -1).replace(/\s+$/, '');
    }
    const keyAnchorChar = keyAnchor.slice(-1);
    const keyContext = keyAnchorChar === '{' || keyAnchorChar === ',';

    // Value position: right after ":", "[", "(" or "," and outside of a string.
    // Shell constructor helpers are only valid here.
    const valueContext =
      !inString &&
      (lastChar === ':' ||
        lastChar === '[' ||
        lastChar === '(' ||
        lastChar === ',');

    if (!keyContext && !valueContext) {
      return { suggestions: [] };
    }

    const range: monacoTypes.IRange = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn,
      endColumn: word.endColumn,
    };

    const { CompletionItemKind, CompletionItemInsertTextRule } =
      this.monaco.languages;

    const suggestions: monacoTypes.languages.CompletionItem[] = [];

    if (keyContext) {
      for (const op of OPERATORS) {
        const base = {
          label: op.name,
          kind: CompletionItemKind.Function,
          detail: op.meta,
          documentation: op.description,
          range,
        };

        if (quotedKey) {
          // Inside a quoted key (`"$match"`) insert only the operator name so
          // the surrounding quotes and any value stay intact.
          suggestions.push({ ...base, insertText: op.name });
        } else {
          // For an unquoted key the leading "$" is escaped so Monaco does not
          // treat it as a snippet placeholder. Stage operators bring a
          // ready-made snippet; everything else gets an expression placeholder.
          suggestions.push({
            ...base,
            insertText: `\\${op.name}: ${op.snippet ?? '${1:expression}'}`,
            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          });
        }
      }
    }

    if (valueContext) {
      for (const helper of SHELL_HELPERS) {
        suggestions.push({
          label: helper.label,
          kind: CompletionItemKind.Constructor,
          detail: helper.detail,
          insertText: helper.insertText,
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      }
    }

    return { suggestions };
  }
}

// Registers the MongoDB operator completion provider for the given editor. The
// returned disposable must be disposed when the editor unmounts.
export function registerMongoCompletion(
  editor: MonacoEditor,
  monaco: Monaco,
): monacoTypes.IDisposable {
  return monaco.languages.registerCompletionItemProvider(
    'javascript',
    new MongoCompletionProvider(editor, monaco),
  );
}
