import { decrypt, encrypt } from './ciphers.ts';

type TController<T> = TransformStreamDefaultController<T>;

export interface CryptOptions {
  secret: Uint8Array;
  password?: Uint8Array;
  token?: Uint8Array;
  iterations?: number;
}

function* concatIters<T>(iters: Iterable<T>[]): Generator<T> {
  for (const iter of iters) yield* iter;
}

export class EncryptionStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(cryptOptions: CryptOptions) {
    super(new EncryptionStream.#Transform(cryptOptions));
  }

  static #Transform = class implements Transformer<Uint8Array, Uint8Array> {
    private chunks: Uint8Array[] = [];

    constructor(private cryptOptions: CryptOptions) {}

    transform(chunk: Uint8Array): void {
      this.chunks.push(chunk);
    }

    async flush(controller: TController<Uint8Array>): Promise<void> {
      const plaintext = Uint8Array.from(concatIters(this.chunks));
      const ciphertext = await encrypt(plaintext, this.cryptOptions);
      controller.enqueue(ciphertext);
    }
  };
}

export class DecryptionStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(cryptOptions: CryptOptions) {
    super(new DecryptionStream.#Transform(cryptOptions));
  }

  static #Transform = class implements Transformer<Uint8Array, Uint8Array> {
    private chunks: Uint8Array[] = [];

    constructor(private cryptOptions: CryptOptions) {}

    transform(chunk: Uint8Array): void {
      this.chunks.push(chunk);
    }

    async flush(controller: TController<Uint8Array>): Promise<void> {
      const ciphertext = Uint8Array.from(concatIters(this.chunks));
      const plaintext = await decrypt(ciphertext, this.cryptOptions);
      controller.enqueue(plaintext);
    }
  };
}
