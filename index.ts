import { DecryptionStream, EncryptionStream } from './crypto/streams.ts';
import { Base64DecoderStream, Base64EncoderStream } from './base64/streams.ts';
import { Base64Encoder } from './base64/encoders.ts';

import type { CryptOptions } from './crypto/streams.ts';

const BITS_PER_BYTE = 8;
const TOKEN_BYTE_LENGTH = 128 / BITS_PER_BYTE;
const SECRET_BYTE_LENTH = 256 / BITS_PER_BYTE;
const COMPRESSION_ALGO = 'deflate-raw';

interface PipelineOptions {
  secret: string;
  password?: string;
  token?: string;
  iterations?: number | string;
}

function cryptOptions(pipelineOptions: PipelineOptions): CryptOptions {
  const textEncoder = new TextEncoder();
  const secret = textEncoder.encode(pipelineOptions.secret);
  const password = pipelineOptions.password
    ? textEncoder.encode(pipelineOptions.password)
    : undefined;
  const token = pipelineOptions.token
    ? textEncoder.encode(pipelineOptions.token)
    : undefined;
  const iterations = pipelineOptions.iterations
    ? Number(pipelineOptions.iterations)
    : undefined;
  return { secret, password, token, iterations };
}

class CollectorStream extends WritableStream<string> {
  result = '';
  constructor() {
    super({
      write: (chunk: string) => {
        this.result += chunk;
      },
    });
  }
}

export function generateSecret(): string {
  const encoder = new Base64Encoder();
  const secret = new Uint8Array(SECRET_BYTE_LENTH);
  crypto.getRandomValues(secret);
  return encoder.encode(secret);
}

export function generateToken(): string {
  const encoder = new Base64Encoder();
  const token = new Uint8Array(TOKEN_BYTE_LENGTH);
  crypto.getRandomValues(token);
  return encoder.encode(token);
}

export function encrypt(
  plaintext: string,
  pipelineOptions: PipelineOptions,
): Promise<string>;
export function encrypt(
  plaintext: ReadableStream<Uint8Array>,
  pipelineOptions: PipelineOptions,
): ReadableStream<Uint8Array>;
export function encrypt(
  plaintext: string | ReadableStream<Uint8Array>,
  pipelineOptions: PipelineOptions,
): Promise<string> | ReadableStream<Uint8Array> {
  if (typeof plaintext === 'string') {
    const collector = new CollectorStream();
    return ReadableStream.from([plaintext])
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new CompressionStream(COMPRESSION_ALGO))
      .pipeThrough(new EncryptionStream(cryptOptions(pipelineOptions)))
      .pipeThrough(new Base64EncoderStream())
      .pipeThrough(new TextDecoderStream())
      .pipeTo(collector)
      .then(() => collector.result);
  } else {
    return plaintext
      .pipeThrough(new CompressionStream(COMPRESSION_ALGO))
      .pipeThrough(new EncryptionStream(cryptOptions(pipelineOptions)))
      .pipeThrough(new Base64EncoderStream());
  }
}

export function decrypt(
  ciphertext: string,
  pipelineOptions: PipelineOptions,
): Promise<string>;
export function decrypt(
  ciphertext: ReadableStream<Uint8Array>,
  pipelineOptions: PipelineOptions,
): ReadableStream<Uint8Array>;
export function decrypt(
  ciphertext: string | ReadableStream<Uint8Array>,
  pipelineOptions: PipelineOptions,
): Promise<string> | ReadableStream<Uint8Array> {
  if (typeof ciphertext === 'string') {
    const collector = new CollectorStream();
    return ReadableStream.from([ciphertext])
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new Base64DecoderStream())
      .pipeThrough(new DecryptionStream(cryptOptions(pipelineOptions)))
      .pipeThrough(new DecompressionStream(COMPRESSION_ALGO))
      .pipeThrough(new TextDecoderStream())
      .pipeTo(collector)
      .then(() => collector.result);
  } else {
    return ciphertext
      .pipeThrough(new Base64DecoderStream())
      .pipeThrough(new DecryptionStream(cryptOptions(pipelineOptions)))
      .pipeThrough(new DecompressionStream(COMPRESSION_ALGO));
  }
}
