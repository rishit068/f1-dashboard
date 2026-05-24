import pako from 'pako';

/**
 * Decode a SignalR ".z" payload — these are base64-encoded, zlib-deflated
 * (raw deflate, NOT gzip) JSON strings. Used by F1 for CarData.z and
 * Position.z which would otherwise be huge.
 *
 * Throws on malformed input — callers should wrap in try/catch since live
 * data sometimes has bad frames during recovery from disconnects.
 */
export function decodeZlibTopic<T = unknown>(payload: string): T {
  const bytes = Buffer.from(payload, 'base64');
  // F1 uses raw deflate (no zlib header), not standard zlib
  const inflated = pako.inflateRaw(bytes, { to: 'string' });
  return JSON.parse(inflated) as T;
}

/** True if a topic name ends with `.z` and needs decoding. */
export function isCompressedTopic(topic: string): boolean {
  return topic.endsWith('.z');
}

/** Strip the `.z` suffix so downstream code uses the canonical topic name. */
export function canonicalTopic(topic: string): string {
  return topic.endsWith('.z') ? topic.slice(0, -2) : topic;
}
