import { z } from 'zod';

export const ApiUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  google_id: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const ApiSessionConfigSchema = z.object({
  googleClientId: z.string(),
  environment: z.string().optional(),
});

export const ApiAuthSessionResponseSchema = z.object({
  user: ApiUserSchema.nullable(),
  config: ApiSessionConfigSchema,
});

export const ApiAuthGoogleRequestSchema = z.object({
  access_token: z.string().min(1),
});
export type ApiAuthGoogleRequest = z.infer<typeof ApiAuthGoogleRequestSchema>;

export const ApiAuthGoogleResponseSchema = z.object({
  success: z.literal(true),
  user: ApiUserSchema,
});
export type ApiAuthGoogleResponse = z.infer<typeof ApiAuthGoogleResponseSchema>;

export const ApiAuthLogoutResponseSchema = z.object({
  success: z.boolean(),
});
export type ApiAuthLogoutResponse = z.infer<typeof ApiAuthLogoutResponseSchema>;
