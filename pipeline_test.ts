import { assertEquals, assertMatch, assertNotEquals } from '@std/assert';
import { generateSecret, generateToken, decryptPipeline, encryptPipeline } from './pipeline.ts';

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

Deno.test(async function encryptDecryptPipelineTest() {
  const pipelineOptions = {
    secret: btoa('secret'),
    token: btoa('token'),
    password: 'password',
    iterations: 1,
  };
  const encrypted = await encryptPipeline('foobar', pipelineOptions);
  const decrypted = await decryptPipeline(encrypted, pipelineOptions);

  assertEquals(decrypted, 'foobar');
});
