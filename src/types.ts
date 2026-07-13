import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export const DEFAULT_QUERIES: Record<QueryType, Partial<Query>> = {
  collections: {},
  find: {
    collection: '',
    filter: '{}',
    sort: '{"_id" : 1}',
    limit: 50,
    explain: false,
    verbosity: 'queryPlanner',
  },
  count: {
    collection: '',
    filter: '{}',
  },
  aggregate: {
    collection: '',
    pipeline: '[\n { "$sort": { "_id": 1 } },\n { "$limit": 50 } \n]',
    explain: false,
    verbosity: 'queryPlanner',
  },
};

export const DEFAULT_QUERY: Partial<Query> = {
  queryType: 'find',
  collection: '',
  filter: '{}',
  sort: '{"_id" : -1}',
  limit: 50,
  explain: false,
  verbosity: 'queryPlanner',
};

export type QueryType = 'collections' | 'find' | 'count' | 'aggregate';

export type Verbosity = 'queryPlanner' | 'executionStats' | 'allPlansExecution';

export interface Query
  extends
  DataQuery,
  QueryModelCollections,
  QueryModelFind,
  QueryModelCount,
  QueryModelAggregate {
  queryType: QueryType;
}

interface QueryModelCollections { }

interface QueryModelFind {
  collection?: string;
  filter?: string;
  sort?: string;
  limit?: number;
  explain?: boolean;
  verbosity?: Verbosity;
}

interface QueryModelCount {
  collection?: string;
  filter?: string;
}

interface QueryModelAggregate {
  collection?: string;
  pipeline?: string;
  explain?: boolean;
  verbosity?: Verbosity;
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
