import { assertEquals } from '@std/assert';
import { Base64Decoder, Base64Encoder } from './encoders.ts';

Deno.test(function Base64EncoderTest() {
  const textEncoder = new TextEncoder();
  const base64Encoder = new Base64Encoder();
  const testEncode = (str: string) =>
    base64Encoder.encode(textEncoder.encode(str));

  assertEquals(testEncode('foobar'), 'Zm9vYmFy');
  assertEquals(testEncode('foobarb'), 'Zm9vYmFyYg==');
  assertEquals(testEncode('foobarba'), 'Zm9vYmFyYmE=');
  assertEquals(testEncode('foobarbaz'), 'Zm9vYmFyYmF6');
});

Deno.test(function decodeTest() {
  const textDecoder = new TextDecoder();
  const base64Decoder = new Base64Decoder();
  const testDecode = (str: string) =>
    textDecoder.decode(base64Decoder.decode(str));

  assertEquals(testDecode('Zm9vYmFy'), 'foobar');
  assertEquals(testDecode('Zm9vYmFyYg=='), 'foobarb');
  assertEquals(testDecode('Zm9vYmFyYmE='), 'foobarba');
  assertEquals(testDecode('Zm9vYmFyYmF6'), 'foobarbaz');
});
