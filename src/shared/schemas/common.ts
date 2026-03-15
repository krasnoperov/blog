import { z } from 'zod';

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
});

export const EmptyObjectSchema = z.object({});
