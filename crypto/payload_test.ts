import { assertEquals } from '@std/assert';
import {
  ByteSizes,
  CryptoAlgorithm,
  decodePayload,
  encodePayload,
} from './payload.ts';

function mockUint8Data() {
  const fill = (_: unknown, i: number) => i;
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, 1000);
  const iterations = new Uint8Array(buffer);
  const iv = Uint8Array.from({ length: ByteSizes.iv }, fill);
  const salt = Uint8Array.from({ length: ByteSizes.salt }, fill);
  const data = new Uint8Array([1, 2, 3]);
  return { iterations, iv, salt, data };
}

Deno.test(function encodePayloadTest() {
  const { iterations, iv, salt, data } = mockUint8Data();
  assertEquals(
    encodePayload({
      options: { requirePassword: true, requireToken: true },
      algo: CryptoAlgorithm.AES_GCM,
      iterations: 1000,
      iv,
      salt,
      data,
    }),
    new Uint8Array([
      1,
      3,
      CryptoAlgorithm.AES_GCM,
      ...iterations,
      ...iv,
      ...salt,
      ...data,
    ]),
  );
});

Deno.test(function decodePayloadTest() {
  const { iterations, iv, salt, data } = mockUint8Data();
  const encoded = new Uint8Array([
    1,
    3,
    CryptoAlgorithm.AES_GCM,
    ...iterations,
    ...iv,
    ...salt,
    ...data,
  ]);
  const actual = decodePayload(encoded);
  assertEquals(actual.version, 1, 'version');
  assertEquals(
    actual.options,
    { requirePassword: true, requireToken: true },
    'options',
  );
  assertEquals(actual.algo, CryptoAlgorithm.AES_GCM, 'algo');
  assertEquals(actual.iv, iv, 'iv');
  assertEquals(actual.salt, salt, 'slat');
  assertEquals(actual.data, data, 'data');
});
