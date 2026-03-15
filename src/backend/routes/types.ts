import type { Hono } from 'hono';
import type { Bindings } from '../index';
import type { createContainer } from '../../core/container';
import type { UploadSecurity } from '../middleware/upload-security';
import type { AuthenticatedRequestUser } from '../features/auth/request-auth';

export type AppContext = {
  Bindings: Bindings;
  Variables: {
    authIsTestSession?: boolean;
    authUser?: AuthenticatedRequestUser;
    container: ReturnType<typeof createContainer>;
    userId?: number;
    uploadSecurity?: UploadSecurity;
  };
};

export type AppType = Hono<AppContext>;
