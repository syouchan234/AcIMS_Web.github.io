// IndexedDB を使用したパスワード管理サービス

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

export class PasswordDatabase {
  private db: IDBDatabase | null = null;

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

  async addPassword(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const now = Date.now();

      const request = store.add({
        ...entry,
        createdAt: now,
        updatedAt: now,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async updatePassword(id: number, entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.init();

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
          ...entry,
          id,
          createdAt: existing.createdAt,
          updatedAt: Date.now(),
        });

        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  }

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

  async getAllPasswords(): Promise<PasswordEntry[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as PasswordEntry[]);
    });
  }

  async getPasswordById(id: number): Promise<PasswordEntry | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getPasswordsByCategory(category: string): Promise<PasswordEntry[]> {
    const allPasswords = await this.getAllPasswords();
    return allPasswords.filter((entry) => entry.category === category);
  }

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

  async replaceAllPasswords(entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    await this.clearAllPasswords();
    for (const entry of entries) await this.addPassword(entry);
  }
}

export const passwordDb = new PasswordDatabase();
