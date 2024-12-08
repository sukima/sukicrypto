import { Base64Decoder, Base64Encoder } from './encoders.ts';

type TController<T> = TransformStreamDefaultController<T>;

export class Base64EncoderStream
  extends TransformStream<Uint8Array, Uint8Array> {
  constructor() {
    super(new Base64EncoderStream.#Transform());
  }

  static #Transform = class implements Transformer<Uint8Array, Uint8Array> {
    private textEncoder = new TextEncoder();
    private base64Encoder = new Base64Encoder();
    private buffer = new Uint8Array();

    transform(chunk: Uint8Array, controller: TController<Uint8Array>): void {
      const { textEncoder, base64Encoder, buffer } = this;
      const allBytes = new Uint8Array([...buffer, ...chunk]);
      const cursor = allBytes.length - (allBytes.length % 3);
      const bytes = allBytes.slice(0, cursor);
      const encodedBytes = textEncoder.encode(base64Encoder.encode(bytes));

      this.buffer = allBytes.slice(cursor);
      controller.enqueue(encodedBytes);
    }

    flush(controller: TController<Uint8Array>): void {
      const { textEncoder, base64Encoder, buffer } = this;

      if (buffer.length === 0) return;

      const encodedBytes = textEncoder.encode(base64Encoder.encode(buffer));
      controller.enqueue(encodedBytes);
    }
  };
}

export class Base64DecoderStream
  extends TransformStream<Uint8Array, Uint8Array> {
  constructor() {
    super(new Base64DecoderStream.#Transform());
  }

  static #Transform = class implements Transformer<Uint8Array, Uint8Array> {
    private textDecoder = new TextDecoder();
    private base64Decoder = new Base64Decoder();
    private buffer = '';

    transform(chunk: Uint8Array, controller: TController<Uint8Array>): void {
      const { textDecoder, base64Decoder, buffer } = this;
      const text = textDecoder.decode(chunk);
      const allData = `${buffer}${text}`.replaceAll(/\s/g, '');
      const cursor = allData.length - (allData.length % 4);
      const data = allData.slice(0, cursor);

      this.buffer = allData.slice(cursor);
      controller.enqueue(base64Decoder.decode(data));
    }

    flush(controller: TController<Uint8Array>): void {
      const { base64Decoder, buffer } = this;

      if (buffer.length === 0) return;

      controller.enqueue(base64Decoder.decode(buffer));
    }
  };
}
