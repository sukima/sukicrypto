import {
  ByteSizes,
  CryptoAlgorithm,
  decodePayload,
  encodePayload,
} from './payload.ts';

const ITERATIONS = 600_000;
const CRYPTO_ALGO = CryptoAlgorithm.AES_GCM;

const AlgoNames = {
  [CryptoAlgorithm.AES_CTR]: 'AES-CTR',
  [CryptoAlgorithm.AES_CBC]: 'AES-CBC',
  [CryptoAlgorithm.AES_GCM]: 'AES-GCM',
} as const;

export interface CryptOptions {
  secret: Uint8Array;
  password?: Uint8Array;
  token?: Uint8Array;
  iterations?: number;
}

function isEmpty(predicate?: Uint8Array): boolean {
  if (!predicate) return true;
  if (predicate.length === 0) return true;
  return false;
}

export class MissingRequirementError extends Error {
  override name = 'MissingRequirementError ';
  static matches(error: unknown): error is MissingRequirementError {
    return error instanceof MissingRequirementError;
  }
}

async function genAESKey(
  options: CryptOptions & { salt: Uint8Array },
): Promise<CryptoKey> {
  const {
    salt,
    secret,
    password = new Uint8Array(),
    token = new Uint8Array(),
    iterations = ITERATIONS,
  } = options;
  const combinedSecret = new Uint8Array([...secret, ...password, ...token]);
  const derivationKey = await crypto.subtle.importKey(
    'raw',
    combinedSecret,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    derivationKey,
    { name: AlgoNames[CRYPTO_ALGO], length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(
  plaintext: Uint8Array,
  cryptOptions: CryptOptions,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(ByteSizes.iv));
  const salt = crypto.getRandomValues(new Uint8Array(ByteSizes.salt));
  const key = await genAESKey({ ...cryptOptions, salt });
  const ciphertext = await crypto.subtle.encrypt(
    { name: AlgoNames[CRYPTO_ALGO], iv },
    key,
    plaintext,
  );
  return encodePayload({
    algo: CRYPTO_ALGO,
    options: {
      requirePassword: !isEmpty(cryptOptions.password),
      requireToken: !isEmpty(cryptOptions.token),
    },
    iterations: cryptOptions.iterations ?? ITERATIONS,
    iv,
    salt,
    data: new Uint8Array(ciphertext),
  });
}

export async function decrypt(
  ciphertext: Uint8Array,
  cryptOptions: CryptOptions,
): Promise<Uint8Array> {
  const payload = decodePayload(ciphertext);
  const { secret, password, token } = cryptOptions;
  const { options, iv, algo, iterations, salt, data } = payload;

  if (options.requirePassword && isEmpty(password)) {
    throw new MissingRequirementError('password required to decrypt');
  }

  if (options.requireToken && isEmpty(token)) {
    throw new MissingRequirementError('token required to decrypt');
  }

  const key = await genAESKey({ secret, password, token, salt, iterations });
  const plaintext = await crypto.subtle.decrypt(
    { name: AlgoNames[algo], iv },
    key,
    data,
  );
  return new Uint8Array(plaintext);
}
