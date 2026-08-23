const PBKDF2_ITERATIONS = 600000;
const HASH_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export interface StoredMasterPassword {
  version: 1;
  algorithm: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  hash: string;
}

const toBase64 = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const fromBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const asBuffer = (value: Uint8Array) => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;

const deriveBaseKey = (password: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS) => crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveBits', 'deriveKey'],
).then((key) => crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: asBuffer(salt), iterations, hash: 'SHA-256' },
  key,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
));

export const createMasterPasswordRecord = async (password: string): Promise<{ record: StoredMasterPassword; key: CryptoKey }> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveBaseKey(password, salt);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: asBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']),
    HASH_LENGTH,
  );
  return { record: { version: 1, algorithm: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS, salt: toBase64(salt), hash: toBase64(hash) }, key };
};

export const verifyMasterPassword = async (password: string, record: StoredMasterPassword): Promise<CryptoKey | null> => {
  const salt = fromBase64(record.salt);
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: asBuffer(salt), iterations: record.iterations, hash: 'SHA-256' },
    baseKey,
    HASH_LENGTH,
  );
  const expected = fromBase64(record.hash);
  const actual = new Uint8Array(bits);
  const matches = actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
  return matches ? deriveBaseKey(password, salt, record.iterations) : null;
};

export const encryptPasswordEntry = async (entry: object, key: CryptoKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = new TextEncoder().encode(JSON.stringify(entry));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: asBuffer(iv) }, key, plaintext);
  return { iv: toBase64(iv), ciphertext: toBase64(ciphertext) };
};

export const decryptPasswordEntry = async <T>(encrypted: { iv: string; ciphertext: string }, key: CryptoKey): Promise<T> => {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: asBuffer(fromBase64(encrypted.iv)) }, key, fromBase64(encrypted.ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
};
