const BASE64URL_RE = /\+/g;

export function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  let buffer: Uint8Array;
  if (input instanceof Uint8Array) {
    buffer = input;
  } else {
    buffer = new Uint8Array(input);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer)
      .toString('base64')
      .replace(BASE64URL_RE, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  let binary = '';
  buffer.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary).replace(BASE64URL_RE, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function computeSha256Edge(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

async function computeSha256Node(message: string): Promise<string> {
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256').update(message).digest();
  return base64UrlEncode(hash);
}

export async function computeCodeChallenge(codeVerifier: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return computeSha256Edge(codeVerifier);
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    return computeSha256Node(codeVerifier);
  }

  throw new Error('SHA-256 not supported in this runtime');
}
