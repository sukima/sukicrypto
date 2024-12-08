import { parseArgs } from 'jsr:@std/cli/parse-args';
import { DecryptionStream, EncryptionStream } from './crypto/streams.ts';
import { Base64DecoderStream, Base64EncoderStream } from './base64/streams.ts';
import { Base64Encoder } from './base64/encoders.ts';

import type { CryptOptions } from './crypto/streams.ts';

const TOKEN_LENGTH = 128;
const SECRET_LENGTH = 256;
const COMPRESSION_ALGO = 'deflate-raw';

interface PipelineOptions {
  secret: string;
  password?: string;
  token?: string;
  iterations?: string;
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

export function encryptPipeline(
  plaintextStream: ReadableStream<Uint8Array>,
  pipelineOptions: PipelineOptions,
): ReadableStream<Uint8Array> {
  return plaintextStream
    .pipeThrough(new CompressionStream(COMPRESSION_ALGO))
    .pipeThrough(new EncryptionStream(cryptOptions(pipelineOptions)))
    .pipeThrough(new Base64EncoderStream());
}

export function decryptPipeline(
  ciphertextStream: ReadableStream<Uint8Array>,
  pipelineOptions: PipelineOptions,
): ReadableStream<Uint8Array> {
  return ciphertextStream
    .pipeThrough(new Base64DecoderStream())
    .pipeThrough(new DecryptionStream(cryptOptions(pipelineOptions)))
    .pipeThrough(new DecompressionStream(COMPRESSION_ALGO));
}

if (import.meta.main) {
  const flags = parseArgs(Deno.args, {
    boolean: ['help', 'gensecret', 'gentoken', 'decrypt'],
    string: ['secret', 'token', 'password'],
    default: { token: '', password: '' },
  });
  const { secret, token, password } = flags;

  if (flags.help) {
    console.log('Usage: deno run main.ts --secret=SECRET < INPUT');
    console.log('help');
    Deno.exit(0);
  }

  if (flags.gensecret) {
    console.log(generateSecret());
    Deno.exit(0);
  }

  if (flags.gentoken) {
    console.log(generateToken());
    Deno.exit(0);
  }

  if (!secret) {
    console.error('Usage: deno run main.ts --secret=SECRET < INPUT');
    Deno.exit(1);
  }

  if (flags.decrypt) {
    await decryptPipeline(Deno.stdin.readable, { secret, token, password })
      .pipeTo(Deno.stdout.writable);
  } else {
    await encryptPipeline(Deno.stdin.readable, { secret, token, password })
      .pipeTo(Deno.stdout.writable);
  }
}
