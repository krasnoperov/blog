import { z } from 'zod';
import { ApiUserSchema } from './auth';

export const ApiUserProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
});
export type ApiUserProfile = z.infer<typeof ApiUserProfileSchema>;

export const ApiUserProfileUpdateRequestSchema = z.object({
  name: z.string().trim().min(1),
});
export type ApiUserProfileUpdateRequest = z.infer<typeof ApiUserProfileUpdateRequestSchema>;

export const ApiUserProfileUpdateResponseSchema = z.object({
  success: z.boolean(),
  user: ApiUserProfileSchema,
});
export type ApiUserProfileUpdateResponse = z.infer<typeof ApiUserProfileUpdateResponseSchema>;

export const ApiUserSettingsUpdateRequestSchema = z.object({
  name: z.string().trim().min(1),
});

export const ApiUserSettingsUpdateResponseSchema = z.object({
  success: z.literal(true),
  user: ApiUserSchema,
});
