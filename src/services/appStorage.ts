import type { StoredMasterPassword } from './security';

const MASTER_PASSWORD_KEY = 'acims_master_password';
const AUTO_LOCK_SETTINGS_KEY = 'acims_auto_lock_settings';

export interface AutoLockSettings {
  enabled: boolean;
  minutes: number;
}

const DEFAULT_AUTO_LOCK_SETTINGS: AutoLockSettings = { enabled: false, minutes: 5 };

/** 現行のハッシュ化済みレコードと旧形式の平文データを読み込む。 */
export const loadMasterPasswordRecord = (): StoredMasterPassword | string | null => {
  const stored = localStorage.getItem(MASTER_PASSWORD_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as StoredMasterPassword;
  } catch {
    return stored;
  }
};

export const hasMasterPasswordRecord = () => Boolean(loadMasterPasswordRecord());

export const saveMasterPasswordRecord = (record: StoredMasterPassword) => {
  localStorage.setItem(MASTER_PASSWORD_KEY, JSON.stringify(record));
};

export const clearMasterPasswordRecord = () => {
  localStorage.removeItem(MASTER_PASSWORD_KEY);
};

export const loadAutoLockSettings = (): AutoLockSettings => {
  try {
    const stored = localStorage.getItem(AUTO_LOCK_SETTINGS_KEY);
    return stored ? { ...DEFAULT_AUTO_LOCK_SETTINGS, ...JSON.parse(stored) } : DEFAULT_AUTO_LOCK_SETTINGS;
  } catch {
    return DEFAULT_AUTO_LOCK_SETTINGS;
  }
};

export const saveAutoLockSettings = (settings: AutoLockSettings) => {
  localStorage.setItem(AUTO_LOCK_SETTINGS_KEY, JSON.stringify(settings));
};
