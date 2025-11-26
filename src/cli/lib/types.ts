export type ParsedArgs = {
  options: Record<string, string>;
  positionals: string[];
};

export type StoredToken = {
  accessToken: string;
  expiresAt: number;
  issuedAt: number;
  scope?: string;
};

export type StoredConfig = {
  environment: string;
  baseUrl: string;
  clientId: string;
  token: StoredToken;
  user: unknown;
  updatedAt: string;
};

export type MultiEnvConfig = {
  configs: Record<string, StoredConfig>;
};
