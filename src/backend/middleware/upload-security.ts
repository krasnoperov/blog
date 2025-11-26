import type { Context, Next } from 'hono';
import type { Env } from '../../core/types';


// Configuration - Start simple, can tighten if abuse occurs
const LIMITS = {
  MAX_FILE_SIZE_MB: 500,
  MIN_INTERVAL_SECONDS: 10, // Basic rate limiting
  ALLOWED_EXTENSIONS: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'webm'],
  ALLOWED_MIME_TYPES: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'audio/webm',
    'audio/x-m4a',
  ],
  // These can be enabled later if needed:
  // MAX_UPLOADS_PER_24H: 50,
  // MAX_TOTAL_SIZE_GB: 10,
};

export class UploadSecurity {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  // Simple rate limiting check (can be enhanced with KV storage later)
  async checkUserQuota(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    // For now, just log the attempt
    console.log('Upload attempt by user:', userId);

    // In the future, can implement with KV storage:
    // - Track last upload time
    // - Count uploads in 24h window
    // - Track total storage used

    // For now, always allow but log for monitoring
    return { allowed: true };
  }

  // Update user metrics after upload
  async updateUserMetrics(userId: number, fileSize: number): Promise<void> {
    // TODO: In production, update KV storage or database to track:
    // - Upload count in 24h window
    // - Total storage used
    // - Last upload timestamp
    console.log('Updated metrics for user', userId, 'added', fileSize, 'bytes');
  }

  // Validate file type and content
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !LIMITS.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${LIMITS.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Check MIME type
    if (!LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file format. File must be an audio file.`
      };
    }

    // Check file size
    const maxSize = LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${LIMITS.MAX_FILE_SIZE_MB}MB.`
      };
    }

    return { valid: true };
  }

  // Validate URL for external audio
  validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return {
          valid: false,
          error: 'Invalid URL protocol. Only HTTP/HTTPS allowed.'
        };
      }

      // Block localhost and internal IPs
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return {
          valid: false,
          error: 'Internal URLs are not allowed.'
        };
      }

      // Check file extension in URL
      const pathname = parsed.pathname.toLowerCase();
      const extension = pathname.split('.').pop();
      if (extension && !LIMITS.ALLOWED_EXTENSIONS.includes(extension)) {
        return {
          valid: false,
          error: `URL must point to an audio file. Allowed types: ${LIMITS.ALLOWED_EXTENSIONS.join(', ')}`
        };
      }

      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format.'
      };
    }
  }

}

// Middleware for upload security
export function uploadSecurityMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: { uploadSecurity?: UploadSecurity } }>, next: Next) => {
    const security = new UploadSecurity(c.env);
    c.set('uploadSecurity', security);
    await next();
  };
}