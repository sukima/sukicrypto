import { assertEquals, assertRejects } from '@std/assert';
import { decrypt, encrypt } from './ciphers.ts';

Deno.test(async function encryptDecryptTest() {
  const encoder = new TextEncoder();
  const secret = encoder.encode('secret');
  const password = encoder.encode('password');
  const token = encoder.encode('token');
  const payload = encoder.encode('foobar');
  const encryptOptions = { secret, password, token, iterations: 1 };

  const ciphertext = await encrypt(payload, encryptOptions);
  const plaintext = await decrypt(ciphertext, encryptOptions);
  const actual = new TextDecoder().decode(plaintext);

  assertEquals(actual, 'foobar');
});

Deno.test(async function missingPasswordTest() {
  const encoder = new TextEncoder();
  const secret = encoder.encode('secret');
  const password = encoder.encode('password');
  const token = encoder.encode('token');
  const payload = encoder.encode('foobar');
  const encryptOptions = { secret, password, token, iterations: 1 };
  const decryptOptions = { secret, token };

  const ciphertext = await encrypt(payload, encryptOptions);
  await assertRejects(() => decrypt(ciphertext, decryptOptions));
});

Deno.test(async function missingTokenTest() {
  const encoder = new TextEncoder();
  const secret = encoder.encode('secret');
  const password = encoder.encode('password');
  const token = encoder.encode('token');
  const payload = encoder.encode('foobar');
  const encryptOptions = { secret, password, token, iterations: 1 };
  const decryptOptions = { secret, password };

  const ciphertext = await encrypt(payload, encryptOptions);
  await assertRejects(() => decrypt(ciphertext, decryptOptions));
});

Deno.test(async function failedDecryptTest() {
  const encoder = new TextEncoder();
  const secret = encoder.encode('secret');
  const password = encoder.encode('password');
  const badPassword = encoder.encode('bork');
  const token = encoder.encode('token');
  const payload = encoder.encode('foobar');
  const encryptOptions = { secret, password, token, iterations: 1 };
  const decryptOptions = { secret, password: badPassword, token };

  const ciphertext = await encrypt(payload, encryptOptions);
  await assertRejects(() => decrypt(ciphertext, decryptOptions));
});
