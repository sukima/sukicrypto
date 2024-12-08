import { assertEquals } from '@std/assert';
import { Base64DecoderStream, Base64EncoderStream } from './streams.ts';

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

Deno.test(async function encodeStreamTest() {
  async function testStream(input: string, expected: string): Promise<void> {
    await ReadableStream.from([input])
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new Base64EncoderStream())
      .pipeThrough(new TextDecoderStream())
      .pipeTo(assertEqualsWriter(expected));
  }

  await testStream('foobar', 'Zm9vYmFy');
  await testStream('foobarb', 'Zm9vYmFyYg==');
  await testStream('foobarba', 'Zm9vYmFyYmE=');
  await testStream('foobarbaz', 'Zm9vYmFyYmF6');
});

Deno.test(async function deodeStreamTest() {
  async function testStream(input: string, expected: string): Promise<void> {
    await ReadableStream.from([input])
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new Base64DecoderStream())
      .pipeThrough(new TextDecoderStream())
      .pipeTo(assertEqualsWriter(expected));
  }

  await testStream('Zm9vYmFy', 'foobar');
  await testStream('Zm9vYmFyYg==', 'foobarb');
  await testStream('Zm9vYmFyYmE=', 'foobarba');
  await testStream('Zm9vYmFyYmF6', 'foobarbaz');
});
