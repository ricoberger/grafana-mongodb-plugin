import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export const DEFAULT_QUERIES: Record<QueryType, Partial<Query>> = {
  collections: {},
  find: {
    collection: '',
    filter: '{}',
    sort: '{"_id" : -1}',
    limit: 50,
  },
};

export const DEFAULT_QUERY: Partial<Query> = {
  queryType: 'find',
  collection: '',
  filter: '{}',
  sort: '{"_id" : -1}',
  limit: 50,
};

export type QueryType = 'collections' | 'find';

export interface Query
  extends DataQuery, QueryModelCollections, QueryModelFind {
  queryType: QueryType;
}

interface QueryModelCollections { }

interface QueryModelFind {
  collection?: string;
  filter?: string;
  sort?: string;
  limit?: number;
}

export interface Options extends DataSourceJsonData {
  hosts?: string;
  port?: number;
  database?: string;
  username?: string;
  connectionOptions?: string;
}

export interface OptionsSecure {
  password?: string;
}
