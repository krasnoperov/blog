import { createHash, randomBytes } from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import type { StoredConfig } from './types';

export const DEFAULT_CLIENT_ID = 'lrsr-cli';
export const DEFAULT_REDIRECT_PORT = 8765;
export const AUTH_SCOPES = 'openid profile email';

/**
 * Detect how the CLI was invoked and return the appropriate command string.
 * Examples:
 * - "npm run cli" when run via package.json script
 * - "npx whitelabel-cli" when run via npx
 * - "whitelabel-cli" when installed globally
 */
function detectCliCommand(): string {
  const argv = process.argv;

  // Check if run via npm/yarn run
  if (argv[1]?.includes('npm') || process.env.npm_lifecycle_event) {
    return 'npm run cli';
  }

  // Check if run via npx
  if (argv[0]?.includes('npx') || process.env.npm_execpath?.includes('npx')) {
    return 'npx whitelabel-cli';
  }

  // Check if run as a global binary
  if (argv[1]?.includes('whitelabel-cli')) {
    return 'whitelabel-cli';
  }

  // Fallback
  return 'npm run cli';
}

export const CLI_COMMAND = detectCliCommand();

export async function fetchOidcConfiguration(baseUrl: string, insecure = false): Promise<Record<string, unknown>> {
  const fetchOptions: RequestInit = {
    headers: {
      'accept': 'application/json',
    },
  };

  // For local dev with self-signed certificates
  if (insecure) {
    (fetchOptions as any).rejectUnauthorized = false;
  }

  const response = await fetch(`${baseUrl}/.well-known/openid-configuration`, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to load OIDC configuration (${response.status})`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

export async function exchangeCodeForToken(input: {
  baseUrl: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
}) {
  const response = await fetch(`${input.baseUrl}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: input.redirectUri,
      client_id: input.clientId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type: string;
    user?: unknown;
  }>;
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hash = createHash('sha256').update(codeVerifier).digest();
  return base64UrlEncode(hash);
}

export function generateState(): string {
  return base64UrlEncode(randomBytes(16));
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export async function waitForAuthorizationCode(port: number, expectedState: string): Promise<{ code: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(getErrorPage('invalid_request', 'Invalid request'));
        return;
      }

      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(getErrorPage('not_found', 'Page not found'));
        return;
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      // Handle OAuth error response
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(getErrorPage(error, errorDescription || undefined));
        clearTimeout(timeout);
        server.close();
        reject(new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`));
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(getErrorPage('invalid_request', 'Missing authorization code'));
        clearTimeout(timeout);
        server.close();
        reject(new Error('Missing authorization code'));
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(getErrorPage('invalid_request', 'State parameter mismatch - possible CSRF attack'));
        clearTimeout(timeout);
        server.close();
        reject(new Error('State mismatch'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getSuccessPage());

      clearTimeout(timeout);
      server.close();
      resolve({ code });
    });

    server.listen(port, '127.0.0.1');

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start local callback server: ${(error as Error).message}`));
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Login timed out waiting for authorization response'));
    }, 5 * 60 * 1000);
  });
}

function getSuccessPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login Successful - Whitelabel CLI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; opacity: 0.9; }
    .checkmark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: inline-block;
      stroke-width: 3;
      stroke: #fff;
      stroke-miterlimit: 10;
      box-shadow: inset 0px 0px 0px #fff;
      animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
      margin-bottom: 1rem;
    }
    .checkmark__circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 3;
      stroke-miterlimit: 10;
      stroke: #fff;
      fill: none;
      animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }
    .checkmark__check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }
    @keyframes stroke {
      100% { stroke-dashoffset: 0; }
    }
    @keyframes scale {
      0%, 100% { transform: none; }
      50% { transform: scale3d(1.1, 1.1, 1); }
    }
    @keyframes fill {
      100% { box-shadow: inset 0px 0px 0px 40px #fff; }
    }
  </style>
</head>
<body>
  <div class="container">
    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
      <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
      <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
    </svg>
    <h1>Login Successful!</h1>
    <p>You can close this window and return to the terminal.</p>
  </div>
</body>
</html>`;
}

function getErrorPage(error: string, description?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login Failed - Whitelabel CLI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 500px;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 0.5rem; }
    .error-code { font-family: monospace; font-size: 0.9rem; opacity: 0.7; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Login Failed</h1>
    <p>${description || 'Authorization was denied or failed.'}</p>
    <p class="error-code">Error: ${error}</p>
    <p>Please return to the terminal and try again.</p>
  </div>
</body>
</html>`;
}

export async function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    let command: string;
    let args: string[];

    if (platform === 'darwin') {
      command = 'open';
      args = [url];
    } else if (platform === 'win32') {
      command = 'cmd';
      args = ['/c', 'start', '""', url];
    } else {
      command = 'xdg-open';
      args = [url];
    }

    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', (error) => reject(error));
    child.on('spawn', () => {
      child.unref();
      resolve();
    });
  });
}
