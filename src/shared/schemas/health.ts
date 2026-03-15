import { z } from 'zod';

export const ApiHealthResponseSchema = z.object({
  status: z.string(),
  environment: z.string().optional(),
});
export type ApiHealthResponse = z.infer<typeof ApiHealthResponseSchema>;

export const ApiHelloResponseSchema = z.object({
  message: z.string(),
});
