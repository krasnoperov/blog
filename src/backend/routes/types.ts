import type { Hono } from 'hono';
import type { Bindings } from '../index';
import type { createContainer } from '../../core/container';
import type { UploadSecurity } from '../middleware/upload-security';

export type AppContext = {
  Bindings: Bindings;
  Variables: {
    container: ReturnType<typeof createContainer>;
    uploadSecurity?: UploadSecurity;
  };
};

export type AppType = Hono<AppContext>;