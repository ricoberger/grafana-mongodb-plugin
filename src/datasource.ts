import {
  CoreApp,
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  LegacyMetricFindQueryOptions,
  MetricFindValue,
  ScopedVars,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';
import { lastValueFrom, Observable } from 'rxjs';

import { DEFAULT_QUERY, Options, Query } from './types';
import { VariableSupport } from './variablesupport';

const toExtendedJson = (value?: string): string | undefined => {
  if (!value) {
    return value;
  }

  const parsedValue = parseFilter(value);
  return EJSON.stringify(parsedValue, { relaxed: true });
};

export class DataSource extends DataSourceWithBackend<Query, Options> {
  constructor(instanceSettings: DataSourceInstanceSettings<Options>) {
    super(instanceSettings);
    this.variables = new VariableSupport(this);
  }

  getDefaultQuery(_: CoreApp): Partial<Query> {
    return DEFAULT_QUERY;
  }

  applyTemplateVariables(query: Query, scopedVars: ScopedVars) {
    return {
      ...query,
      queryType: query.queryType || DEFAULT_QUERY.queryType,
      collection: getTemplateSrv().replace(query.collection, scopedVars),
      filter: getTemplateSrv().replace(
        toExtendedJson(query.filter),
        scopedVars,
      ),
      sort: getTemplateSrv().replace(query.sort, scopedVars),
      pipeline: getTemplateSrv().replace(
        toExtendedJson(query.pipeline),
        scopedVars,
      ),
    };
  }

  query(request: DataQueryRequest<Query>): Observable<DataQueryResponse> {
    return super.query(request);
  }

  async metricFindQuery(
    query: Query,
    options?: LegacyMetricFindQueryOptions,
  ): Promise<MetricFindValue[]> {
    const q = this.query({
      targets: [
        {
          ...query,
          refId: query.refId
            ? `metricsFindQuery-${query.refId}`
            : 'metricFindQuery',
        },
      ],
      range: options?.range,
    } as DataQueryRequest<Query>);

    const response = await lastValueFrom(q as Observable<DataQueryResponse>);

    if (
      response &&
      (!response.data.length || !response.data[0].fields.length)
    ) {
      return [];
    }

    return response
      ? (response.data[0] as DataFrame).fields[0].values.map((_) => {
        return {
          text: _.toString(),
          value: _.toString(),
        };
      })
      : [];
  }

  filterQuery(query: Query): boolean {
    if (
      query.queryType === 'find' &&
      (!query.collection || !query.filter || !query.sort || !query.limit)
    ) {
      return false;
    }

    if (query.queryType === 'count' && (!query.collection || !query.filter)) {
      return false;
    }

    if (
      query.queryType === 'aggregate' &&
      (!query.collection || !query.pipeline)
    ) {
      return false;
    }

    return true;
  }
}
