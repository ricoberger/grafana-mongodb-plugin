import { Query, QueryType } from './types';

// Fields that must be set for a query of a given type to be executed. This is
// the single source of truth shared by DataSource.filterQuery (which decides
// whether a query is run) and the query editor (which warns the user about
// missing fields), so the two never drift apart.
export const REQUIRED_FIELDS: Record<QueryType, Array<keyof Query>> = {
  collections: [],
  find: ['collection', 'filter', 'sort', 'limit'],
  count: ['collection', 'filter'],
  aggregate: ['collection', 'pipeline'],
  databasestats: [],
  collectionstats: ['collection'],
  indexes: [],
  indexstats: ['collection', 'index'],
};

const FIELD_LABELS: Partial<Record<keyof Query, string>> = {
  collection: 'Collection',
  filter: 'Filter',
  sort: 'Sort',
  limit: 'Limit',
  pipeline: 'Pipeline',
  index: 'Index',
};

export const getMissingRequiredFields = (query: Query): string[] => {
  const required = REQUIRED_FIELDS[query.queryType] ?? [];
  return required
    .filter((field) => !query[field])
    .map((field) => FIELD_LABELS[field] ?? field);
};
