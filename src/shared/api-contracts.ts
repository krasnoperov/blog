import { type z } from 'zod';
export * from './contracts/api-contracts-common';
import { authApiContracts } from './contracts/api-contracts-auth';
import { healthApiContracts } from './contracts/api-contracts-health';
import { oauthApiContracts } from './contracts/api-contracts-oauth';
import { userApiContracts } from './contracts/api-contracts-user';

export const apiContracts = {
  ...authApiContracts,
  ...oauthApiContracts,
  ...userApiContracts,
  ...healthApiContracts,
} as const;

type ApiContractCatalog = typeof apiContracts;
type ApiContractValue = ApiContractCatalog[keyof ApiContractCatalog];
export type ApiContractKey = Extract<keyof ApiContractCatalog, string>;
export type ApiContractPath = Extract<ApiContractValue['path'], string>;

type ApiContractEntryByPath<K extends ApiContractPath> = {
  [ContractKey in ApiContractKey]:
    ApiContractCatalog[ContractKey]['path'] extends K
      ? ApiContractCatalog[ContractKey]
      : never;
}[ApiContractKey];

export type ApiContractKeyOrPath = ApiContractKey | ApiContractPath;

export type ApiContractEntry<K extends ApiContractKeyOrPath> = K extends ApiContractKey
  ? ApiContractCatalog[K]
  : ApiContractEntryByPath<Extract<K, ApiContractPath>>;

// Zod exposes the object config type only through this generic position.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiShape<T extends z.ZodTypeAny | undefined> = T extends z.ZodObject<infer Shape, any>
  ? OptionalizeUndefined<{
      [K in keyof Shape]: z.input<Shape[K]>;
    }>
  : z.input<NonNullable<T>>;

type KeysWithUndefined<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];
type KeysWithoutUndefined<T> = Exclude<keyof T, KeysWithUndefined<T>>;

type OptionalizeUndefined<T extends object> = {
  [K in KeysWithoutUndefined<T>]: T[K];
} & {
  [K in KeysWithUndefined<T>]?: Exclude<T[K], undefined>;
};

export type ApiPathParams<K extends ApiContractKeyOrPath> = {
  [P in ApiContractEntry<K>['pathParams'][number]]: string;
};

export type ApiRequestBody<K extends ApiContractKeyOrPath> = ApiShape<ApiContractEntry<K>['body']>;
export type ApiQuery<K extends ApiContractKeyOrPath> = ApiShape<ApiContractEntry<K>['query']>;
export type ApiResponse<K extends ApiContractKeyOrPath> = z.output<ApiContractEntry<K>['response']>;
