import type { Env } from '../core/types';

interface ByteRange {
  end: number;
  start: number;
}

// The Assets binding omits Content-Length inside a Worker. These immutable
// publication assets need their build-time sizes so we can form Content-Range.
const mediaAssetSizes: Record<string, number> = {
  '/media/celld/durable-objects-explained.mp4': 14_131_658,
  '/media/celld/durable-objects-under-the-hood.mp4': 11_339_055,
  '/media/celld/writing-practice-on-celld.mp4': 4_657_366,
};

function parseByteRange(value: string, size: number): ByteRange | undefined {
  if (!value.startsWith('bytes=') || value.includes(',')) {
    return undefined;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) {
    return undefined;
  }

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return undefined;
    }
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 0 ||
    requestedEnd < start ||
    start >= size
  ) {
    return undefined;
  }

  return { start, end: Math.min(requestedEnd, size - 1) };
}

function sliceStream(body: ReadableStream<Uint8Array>, range: ByteRange): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const endExclusive = range.end + 1;
  let offset = 0;
  let finished = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (!finished) {
        const chunk = await reader.read();
        if (chunk.done) {
          finished = true;
          controller.close();
          return;
        }

        const chunkStart = offset;
        const chunkEnd = offset + chunk.value.byteLength;
        offset = chunkEnd;
        if (chunkEnd <= range.start) {
          continue;
        }

        const from = Math.max(0, range.start - chunkStart);
        const to = Math.min(chunk.value.byteLength, endExclusive - chunkStart);
        if (to > from) {
          controller.enqueue(chunk.value.subarray(from, to));
        }

        if (chunkEnd >= endExclusive) {
          finished = true;
          await reader.cancel('requested byte range delivered');
          controller.close();
        }
        return;
      }
    },
    async cancel(reason) {
      finished = true;
      await reader.cancel(reason);
    },
  });
}

export async function serveMediaAsset(request: Request, assets: Env['ASSETS']): Promise<Response> {
  const assetHeaders = new Headers(request.headers);
  assetHeaders.delete('Range');
  const assetResponse = await assets.fetch(new Request(request, { headers: assetHeaders }));
  if (!assetResponse.ok || request.method === 'HEAD') {
    return assetResponse;
  }

  const headers = new Headers(assetResponse.headers);
  headers.set('Accept-Ranges', 'bytes');
  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader) {
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  }

  const size = Number(headers.get('Content-Length')) || mediaAssetSizes[new URL(request.url).pathname];
  if (!assetResponse.body || !Number.isSafeInteger(size) || size <= 0) {
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  }

  const range = parseByteRange(rangeHeader, size);
  if (!range) {
    await assetResponse.body.cancel('invalid byte range');
    headers.set('Content-Range', `bytes */${size}`);
    headers.set('Content-Length', '0');
    return new Response(null, { status: 416, headers });
  }

  headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
  headers.set('Content-Length', String(range.end - range.start + 1));
  return new Response(sliceStream(assetResponse.body, range), { status: 206, headers });
}
