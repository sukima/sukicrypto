import { assertEquals } from '@std/assert';
import { DecryptionStream, EncryptionStream } from './streams.ts';

function assertEqualsWriter(expected: string): WritableStream<string> {
  let result = '';
  return new WritableStream({
    write(chunk: string) {
      result += chunk;
    },
    close() {
      assertEquals(result, expected);
    },
  });
}

Deno.test(async function encryptDecryptStreamsTest() {
  const encoder = new TextEncoder();
  const secret = encoder.encode('secret');
  const password = encoder.encode('password');
  const token = encoder.encode('token');
  const options = { secret, password, token, iterations: 1 };

  await ReadableStream.from(['foobar'])
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(new EncryptionStream(options))
    .pipeThrough(new DecryptionStream(options))
    .pipeThrough(new TextDecoderStream())
    .pipeTo(assertEqualsWriter('foobar'));
});
