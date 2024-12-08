import { DecryptionStream, EncryptionStream } from './crypto/streams.ts';
import { Base64DecoderStream, Base64EncoderStream } from './base64/streams.ts';
import { Base64Encoder, Base64Decoder } from './base64/encoders.ts';

import type { CryptOptions } from './crypto/streams.ts';

const TOKEN_LENGTH = 128;
const SECRET_LENGTH = 256;
const COMPRESSION_ALGO = 'deflate-raw';

interface PipelineOptions {
  secret: string;
  password?: string;
  token?: string;
  iterations?: number;
}

function cryptOptions(pipelineOptions: PipelineOptions): CryptOptions {
  const textEncoder = new TextEncoder();
  const base64Decoder = new Base64Decoder();
  const secret = base64Decoder.decode(pipelineOptions.secret);
  const password = pipelineOptions.password
    ? textEncoder.encode(pipelineOptions.password)
    : undefined;
  const token = pipelineOptions.token
    ? base64Decoder.decode(pipelineOptions.token)
    : undefined;
  return { ...pipelineOptions, secret, password, token };
}

export function generateSecret(): string {
  const encoder = new Base64Encoder();
  const secret = new Uint8Array(SECRET_LENGTH);
  crypto.getRandomValues(secret);
  return encoder.encode(secret);
}

export function generateToken(): string {
  const encoder = new Base64Encoder();
  const token = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(token);
  return encoder.encode(token);
}

export async function encryptPipeline(
  plaintext: string,
  pipelineOptions: PipelineOptions,
): Promise<string> {
  const pipeline = ReadableStream.from([plaintext])
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(new CompressionStream(COMPRESSION_ALGO))
    .pipeThrough(new EncryptionStream(cryptOptions(pipelineOptions)))
    .pipeThrough(new Base64EncoderStream())
    .pipeThrough(new TextDecoderStream());
  let result = '';
  for await (const chunk of pipeline) result += chunk;
  return result;
}

export async function decryptPipeline(
  ciphertext: string,
  pipelineOptions: PipelineOptions,
): Promise<string> {
  const pipeline = ReadableStream.from([ciphertext])
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(new Base64DecoderStream())
    .pipeThrough(new DecryptionStream(cryptOptions(pipelineOptions)))
    .pipeThrough(new DecompressionStream(COMPRESSION_ALGO))
    .pipeThrough(new TextDecoderStream());
  let result = '';
  for await (const chunk of pipeline) result += chunk;
  return result;
}
