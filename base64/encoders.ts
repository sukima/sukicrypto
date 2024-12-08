export class Base64Encoder {
  encode(bytes: Uint8Array): string {
    const fromCodePoint = (byte: number) => String.fromCodePoint(byte);
    return btoa(Array.from(bytes, fromCodePoint).join(''));
  }
}

export class Base64Decoder {
  decode(encoded: string): Uint8Array {
    const toCodePoint = (binChar: string) => binChar.codePointAt(0) ?? 0;
    return Uint8Array.from(atob(encoded), toCodePoint);
  }
}
