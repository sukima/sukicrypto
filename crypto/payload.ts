const VERSION = 1;

enum OptionFlags {
  notFlag,
  requirePassword,
  requireToken,
}

export enum CryptoAlgorithm {
  AES_CTR,
  AES_CBC,
  AES_GCM,
}

export const ByteSizes = { header: 7, iv: 12, salt: 16 } as const;

export interface Payload {
  version: number;
  options: {
    requirePassword: boolean;
    requireToken: boolean;
  };
  algo: CryptoAlgorithm;
  iterations: number;
  iv: Uint8Array;
  salt: Uint8Array;
  data: Uint8Array;
}

function optionsToBits(options: Payload['options']): number {
  const { notFlag, requirePassword, requireToken } = OptionFlags;
  let flags = 0;
  flags |= options.requirePassword ? requirePassword : notFlag;
  flags |= options.requireToken ? requireToken : notFlag;
  return flags;
}

function bitsToOptions(bits: number): Payload['options'] {
  const hasFlag = (flag: number) => Boolean(bits & flag);
  return {
    requirePassword: hasFlag(OptionFlags.requirePassword),
    requireToken: hasFlag(OptionFlags.requireToken),
  };
}

export function encodePayload(payload: Omit<Payload, 'version'>): Uint8Array {
  const header = new ArrayBuffer(ByteSizes.header);
  const view = new DataView(header);

  view.setUint8(0, VERSION);
  view.setUint8(1, optionsToBits(payload.options));
  view.setUint8(2, payload.algo);
  view.setUint32(3, payload.iterations);

  return new Uint8Array([
    ...new Uint8Array(header),
    ...payload.iv,
    ...payload.salt,
    ...payload.data,
  ]);
}

export function decodePayload(encoded: Uint8Array): Payload {
  const { header, iv, salt } = ByteSizes;
  const view = new DataView(encoded.buffer);
  return {
    version: view.getUint8(0),
    options: bitsToOptions(view.getUint8(1)),
    algo: view.getUint8(2),
    iterations: view.getUint32(3),
    iv: encoded.slice(header, header + iv),
    salt: encoded.slice(header + iv, header + iv + salt),
    data: encoded.slice(header + iv + salt),
  };
}
