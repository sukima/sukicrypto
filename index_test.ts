import { assertEquals, assertMatch, assertNotEquals } from '@std/assert';
import { decrypt, encrypt, generateSecret, generateToken } from './index.ts';

function assertEqualsStream(expected: string): WritableStream<string> {
  let result = '';
  return new WritableStream<string>({
    write: (chunk: string) => {
      result += chunk;
    },
    close: () => {
      assertEquals(result, expected);
    },
  });
}

Deno.test(function genSecretTest() {
  assertNotEquals(generateSecret(), generateSecret());
  assertEquals(generateSecret().length % 4, 0);
  assertMatch(generateSecret(), /^[a-zA-Z0-9+\/]+={0,2}$/);
});

Deno.test(function genTokenTest() {
  assertNotEquals(generateToken(), generateToken());
  assertEquals(generateToken().length % 4, 0);
  assertMatch(generateToken(), /^[a-zA-Z0-9+\/]+={0,2}$/);
});

Deno.test(async function encryptDecryptStringTest() {
  const secret = btoa('secret');
  const token = btoa('token');
  const password = 'password';
  const pipelineOptions = { secret, token, password, iterations: 1 };
  const ciphertext = await encrypt('foobar', pipelineOptions);
  const plaintext = await decrypt(ciphertext, pipelineOptions);
  assertEquals(plaintext, 'foobar');
});

Deno.test(async function encryptDecryptPipelineTest() {
  const secret = btoa('secret');
  const token = btoa('token');
  const password = 'password';
  const pipelineOptions = { secret, token, password, iterations: '1' };
  const plaintextStream = ReadableStream.from(['foobar'])
    .pipeThrough(new TextEncoderStream());
  const ciphertextStream = encrypt(plaintextStream, pipelineOptions);
  const resultStream = decrypt(ciphertextStream, pipelineOptions);
  await resultStream
    .pipeThrough(new TextDecoderStream())
    .pipeTo(assertEqualsStream('foobar'));
});
