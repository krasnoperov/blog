import { type z } from 'zod';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export interface ApiContract<
  TMethod extends HttpMethod,
  TPath extends string,
  TBody extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined,
  TResponse extends z.ZodTypeAny = z.ZodTypeAny,
  TPathParams extends readonly string[] = readonly [],
> {
  method: TMethod;
  path: TPath;
  pathParams: TPathParams;
  body?: TBody;
  query?: TQuery;
  response: TResponse;
}

export function defineContract<
  TMethod extends HttpMethod,
  TPath extends string,
  TBody extends z.ZodTypeAny | undefined,
  TQuery extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny,
  TPathParams extends readonly string[],
>(contract: ApiContract<TMethod, TPath, TBody, TQuery, TResponse, TPathParams>) {
  return contract;
}
