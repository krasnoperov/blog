export class ApiError extends Error {
  status: number;
  code?: string;
  retryable?: boolean;

  constructor(message: string, status: number, options?: { code?: string; retryable?: boolean }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.retryable = options?.retryable;
  }
}

export function parseApiErrorPayload(payload: unknown, status: number): {
  message: string;
  code?: string;
  retryable?: boolean;
} {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    return {
      message:
        typeof record.error === 'string'
          ? record.error
          : typeof record.message === 'string'
            ? record.message
            : `Request failed with status ${status}`,
      code: typeof record.code === 'string' ? record.code : undefined,
      retryable: typeof record.retryable === 'boolean' ? record.retryable : undefined,
    };
  }

  return {
    message: `Request failed with status ${status}`,
  };
}
