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

/** バイナリ値を Local Storage と IndexedDB に保存できる Base64 文字列へ変換する。 */
const toBase64 = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

/** Base64 文字列を Web Crypto API が扱えるバイト列へ復元する。 */
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
/** 部分配列を含まない ArrayBuffer に変換し、Web Crypto API の型要件を満たす。 */
const asBuffer = (value: Uint8Array) => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;

/** マスターパスワードとソルトから、エントリー暗号化用の AES-GCM 鍵を導出する。 */
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

/** 新しいマスターパスワードの検証情報と、同じパスワードから導出した復号鍵を作成する。 */
export const createMasterPasswordRecord = async (password: string): Promise<{ record: StoredMasterPassword; key: CryptoKey }> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveBaseKey(password, salt);
  // パスワード自体は保存せず、認証時の照合に使う PBKDF2 の導出値だけを保存する。
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: asBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']),
    HASH_LENGTH,
  );
  return { record: { version: 1, algorithm: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS, salt: toBase64(salt), hash: toBase64(hash) }, key };
};

/** 入力されたマスターパスワードを照合し、正しい場合だけ暗号化鍵を返す。 */
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

/** パスワードエントリーを AES-GCM で暗号化し、保存用の Base64 形式にする。 */
export const encryptPasswordEntry = async (entry: object, key: CryptoKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = new TextEncoder().encode(JSON.stringify(entry));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: asBuffer(iv) }, key, plaintext);
  return { iv: toBase64(iv), ciphertext: toBase64(ciphertext) };
};

/** 保存済みの暗号文を復号して元のパスワードエントリーに戻す。 */
export const decryptPasswordEntry = async <T>(encrypted: { iv: string; ciphertext: string }, key: CryptoKey): Promise<T> => {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: asBuffer(fromBase64(encrypted.iv)) }, key, fromBase64(encrypted.ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
};
