import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Context, MiddlewareHandler } from 'hono';
import type { ZodTypeAny } from 'zod';
import {
  apiContracts,
  type ApiContractEntry,
  type ApiContractKey,
  type ApiPathParams,
  type ApiQuery,
  type ApiRequestBody,
} from '../../shared/api-contracts';
import { ApiErrorResponseSchema } from '../../shared/schemas/common';
import type { AppContext } from '../routes/types';

type HttpMethod = ApiContractEntry<ApiContractKey>['method'];

type RouteResponseEntry = {
  description: string;
  content?: {
    'application/json': {
      schema: ZodTypeAny;
    };
  };
};

type RouteResponseMap = {
  [code: number]: RouteResponseEntry;
};

type ValidationHookErrorShape = {
  success?: boolean;
};

export type OpenApiContractOptions<K extends ApiContractKey> = {
  middleware?: MiddlewareHandler[];
  summary?: string;
  description?: string;
  tags?: string[];
  responses?: RouteResponseMap;
  errorMessage?: string;
  websocket?: boolean;
  query?: ApiContractEntry<K>['query'];
  body?: ApiContractEntry<K>['body'];
};

type ContractRouteContext<K extends ApiContractKey> = Omit<Context<AppContext>, 'req' | 'set'> & {
  req: Omit<Context<AppContext>['req'], 'param' | 'valid'> & {
    param: Context['req']['param'] & {
      (): ApiPathParams<K>;
    };
    valid: Context['req']['valid'] & {
      (type: 'json'): ApiRequestBody<K>;
      (type: 'query'): ApiQuery<K>;
      (type: 'param'): ApiPathParams<K>;
    };
  };
  set: Context['set'];
};

function toOpenApiPath(path: string): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

function buildParamsSchema(pathParams: readonly string[]) {
  if (!pathParams.length) {
    return undefined;
  }

  const shape = Object.fromEntries(
    pathParams.map((param) => [param, z.string().describe(`${param} path parameter`)]),
  );
  return z.object(shape);
}

function toOpenApiMethod(method: HttpMethod): Lowercase<HttpMethod> {
  return method.toLowerCase() as Lowercase<HttpMethod>;
}

export function toContractOpenApiRoute<K extends ApiContractKey>(
  key: K,
  options: OpenApiContractOptions<K> = {},
) {
  const contract = apiContracts[key] as ApiContractEntry<K>;
  const querySchema = options.query ?? contract.query;
  const bodySchema = options.body ?? contract.body;
  const hasErrorMessage = Boolean(options.errorMessage);

  return createRoute({
    operationId: key,
    method: toOpenApiMethod(contract.method),
    path: toOpenApiPath(contract.path),
    summary: options.summary,
    description: options.description,
    tags: options.tags,
    middleware: options.middleware,
    request: {
      params: buildParamsSchema(contract.pathParams),
      ...(querySchema ? { query: querySchema as never } : {}),
      ...(bodySchema ? {
        body: {
          content: {
            'application/json': {
              schema: bodySchema as never,
            },
          },
        },
      } : {}),
    },
    responses: {
      ...(options.responses ?? {}),
      ...(hasErrorMessage && options.responses?.[400] === undefined ? {
        400: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: ApiErrorResponseSchema,
            },
          },
        },
      } : {}),
      ...(!options.websocket ? {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: contract.response,
            },
          },
        },
      } : {}),
      401: {
        description: 'Not authenticated',
        content: { 'application/json': { schema: ApiErrorResponseSchema } },
      },
      ...(!options.websocket ? {
        404: {
          description: 'Not found',
          content: { 'application/json': { schema: ApiErrorResponseSchema } },
        },
      } : {}),
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: ApiErrorResponseSchema } },
      },
    },
  });
}

export function registerContractRoute<K extends ApiContractKey>(
  app: OpenAPIHono<AppContext>,
  key: K,
  handler: (c: ContractRouteContext<K>) => unknown | Promise<unknown>,
  options?: OpenApiContractOptions<K>,
): void {
  const route = toContractOpenApiRoute(key, options);
  const errorMessage = options?.errorMessage;

  if (!errorMessage) {
    app.openapi(route, handler as never);
    return;
  }

  app.openapi(
    route,
    handler as never,
    ((result: ValidationHookErrorShape, c: ContractRouteContext<K>) => {
      if (!result.success) {
        return c.json({ error: errorMessage }, 400);
      }
    }) as never,
  );
}
