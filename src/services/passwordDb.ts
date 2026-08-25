// IndexedDB を使用したパスワード管理サービス
import { decryptPasswordEntry, encryptPasswordEntry } from './security';

export interface PasswordEntry {
  id?: number;
  category: string;
  appName: string;
  userId: string;
  email: string;
  password: string;
  url: string;
  memo: string;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = 'PasswordManager';
const DB_VERSION = 1;
const STORE_NAME = 'passwords';

interface EncryptedPasswordRecord {
  id?: number;
  encrypted: { iv: string; ciphertext: string };
  createdAt: number;
  updatedAt: number;
}

export class PasswordDatabase {
  private db: IDBDatabase | null = null;

  /** 旧形式の平文レコードを読み込み時に暗号化形式へ移行する。 */
  private async migrateLegacyRecords(records: PasswordEntry[], key: CryptoKey): Promise<void> {
    if (!records.length) return;
    const encryptedRecords = await Promise.all(records.map(async (entry) => ({
      id: entry.id,
      encrypted: await encryptPasswordEntry({ category: entry.category, appName: entry.appName, userId: entry.userId, email: entry.email, password: entry.password, url: entry.url, memo: entry.memo }, key),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })));
    // 1つのトランザクションで置き換え、途中失敗時に不完全な移行を残さない。
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      encryptedRecords.forEach((record) => store.put(record));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  /** IndexedDB を開き、初回起動時はパスワード保存用ストアを作成する。 */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  /** 新しいエントリーを暗号化して IndexedDB に追加し、採番された ID を返す。 */
  async addPassword(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>, key: CryptoKey): Promise<number> {
    if (!this.db) await this.init();
    const encrypted = await encryptPasswordEntry(entry, key);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const now = Date.now();

      const request = store.add({
        encrypted,
        createdAt: now,
        updatedAt: now,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  /** 指定 ID のエントリーを再暗号化して更新し、作成日時は保持する。 */
  async updatePassword(id: number, entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>, key: CryptoKey): Promise<void> {
    if (!this.db) await this.init();
    const encrypted = await encryptPasswordEntry(entry, key);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const existing = request.result;
        if (!existing) {
          reject(new Error(`パスワード (ID: ${id}) が見つかりません`));
          return;
        }

        const updateRequest = store.put({
          id,
          encrypted,
          createdAt: existing.createdAt,
          updatedAt: Date.now(),
        });

        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  }

  /** 指定 ID のエントリーを IndexedDB から削除する。 */
  async deletePassword(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /** 全エントリーを取得して復号し、旧形式があれば暗号化形式へ移行する。 */
  async getAllPasswords(key: CryptoKey): Promise<PasswordEntry[]> {
    if (!this.db) await this.init();
    const records = await new Promise<Array<EncryptedPasswordRecord | PasswordEntry>>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as Array<EncryptedPasswordRecord | PasswordEntry>);
    });
    const legacyRecords = records.filter((record): record is PasswordEntry => !('encrypted' in record));
    await this.migrateLegacyRecords(legacyRecords, key);
    return Promise.all(records.map(async (record) => {
      if ('encrypted' in record) {
        const entry = await decryptPasswordEntry<Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>>(record.encrypted, key);
        return { ...entry, id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt };
      }
      return record;
    }));
  }

  /** 指定 ID のエントリーを取得して復号する。存在しない場合は null を返す。 */
  async getPasswordById(id: number, key: CryptoKey): Promise<PasswordEntry | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (!request.result) { resolve(null); return; }
        try {
          const record = request.result as EncryptedPasswordRecord | PasswordEntry;
          if (!('encrypted' in record)) {
            await this.migrateLegacyRecords([record], key);
            resolve(record);
            return;
          }
          const entry = await decryptPasswordEntry<Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>>(record.encrypted, key);
          resolve({ ...entry, id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt });
        } catch (error) { reject(error); }
      };
    });
  }

  /** 指定カテゴリに属するエントリーだけを返す。 */
  async getPasswordsByCategory(category: string, key: CryptoKey): Promise<PasswordEntry[]> {
    const allPasswords = await this.getAllPasswords(key);
    return allPasswords.filter((entry) => entry.category === category);
  }

  /** すべてのパスワードエントリーを削除する。 */
  async clearAllPasswords(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /** インポートや鍵変更用に、全エントリーを削除して指定内容で入れ替える。 */
  async replaceAllPasswords(entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[], key: CryptoKey): Promise<void> {
    await this.clearAllPasswords();
    for (const entry of entries) await this.addPassword(entry, key);
  }
}

export const passwordDb = new PasswordDatabase();
