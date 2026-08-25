import { useCallback, useEffect, useRef, useState } from 'react';
import {
  authenticateWithBiometrics,
  clearBiometricCredential,
  isBiometricAuthenticationAvailable,
  isBiometricAuthenticationSupported,
  registerBiometricCredential,
} from '../services/biometricAuth';
import {
  clearMasterPasswordRecord,
  hasMasterPasswordRecord,
  loadAutoLockSettings,
  loadMasterPasswordRecord,
  saveAutoLockSettings,
  saveMasterPasswordRecord,
  type AutoLockSettings,
} from '../services/appStorage';
import { passwordDb } from '../services/passwordDb';
import { createMasterPasswordRecord, verifyMasterPassword } from '../services/security';

const MIN_MASTER_PASSWORD_LENGTH = 4;
const MAX_AUTO_LOCK_MINUTES = 60;

const normalizeMasterPassword = (password: string) => password.trim();

const toAutoLockSettings = (settings: AutoLockSettings): AutoLockSettings => ({
  enabled: settings.enabled,
  minutes: Math.min(MAX_AUTO_LOCK_MINUTES, Math.max(1, settings.minutes || 1)),
});

export type { AutoLockSettings } from '../services/appStorage';

/** アプリの画面遷移、認証、自動ロックの状態を管理する。 */
export const useAppController = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [showHome, setShowHome] = useState(() => !hasMasterPasswordRecord());
  const [showPasswordAuth, setShowPasswordAuth] = useState(hasMasterPasswordRecord);
  const [showPasswordManager, setShowPasswordManager] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [autoLockSettings, setAutoLockSettings] = useState<AutoLockSettings>(loadAutoLockSettings);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biometricAuthenticationInProgress = useRef(false);

  const isBiometricSupported = isBiometricAuthenticationSupported();

  const showOnly = (screen: 'home' | 'setup' | 'auth' | 'manager') => {
    setShowHome(screen === 'home');
    setShowSetup(screen === 'setup');
    setShowPasswordAuth(screen === 'auth');
    setShowPasswordManager(screen === 'manager');
  };

  const clearInputAndErrors = () => {
    setMasterPassword('');
    setConfirmPassword('');
    setAuthPassword('');
    setSetupError('');
    setAuthError('');
  };

  const goToHome = () => {
    showOnly('home');
    clearInputAndErrors();
  };

  const goToPasswordAuth = () => {
    showOnly('auth');
    setAuthPassword('');
    setAuthError('');
  };

  const lockPasswordManager = useCallback(() => {
    showOnly('auth');
    setAuthPassword('');
    setAuthError('');
  }, []);

  useEffect(() => {
    if (!showPasswordAuth) {
      setIsBiometricAvailable(false);
      return;
    }

    let isMounted = true;
    void isBiometricAuthenticationAvailable().then((available) => {
      if (isMounted) setIsBiometricAvailable(available);
    });

    return () => { isMounted = false; };
  }, [showPasswordAuth]);

  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    if (!showPasswordManager || !autoLockSettings.enabled) return;

    autoLockTimer.current = setTimeout(lockPasswordManager, autoLockSettings.minutes * 60 * 1000);
  }, [autoLockSettings, lockPasswordManager, showPasswordManager]);

  useEffect(() => {
    resetAutoLockTimer();
    if (!showPasswordManager || !autoLockSettings.enabled) return undefined;

    const activityEvents = ['pointerdown', 'keydown', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetAutoLockTimer));

    return () => {
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetAutoLockTimer));
    };
  }, [autoLockSettings.enabled, resetAutoLockTimer, showPasswordManager]);

  const goToPasswordManager = () => {
    if (hasMasterPasswordRecord()) goToPasswordAuth();
    else showOnly('setup');
  };

  const handleSetup = async () => {
    const password = normalizeMasterPassword(masterPassword);
    if (password.length < MIN_MASTER_PASSWORD_LENGTH) {
      setSetupError(`マスターパスワードは${MIN_MASTER_PASSWORD_LENGTH}文字以上で設定してください`);
      return;
    }
    if (password !== normalizeMasterPassword(confirmPassword)) {
      setSetupError('確認用パスワードが一致しません');
      return;
    }

    const { record, key } = await createMasterPasswordRecord(password);
    saveMasterPasswordRecord(record);
    setEncryptionKey(key);
    void registerBiometricCredential();
    showOnly('manager');
    setSetupError('');
  };

  const handleAuth = async () => {
    const storedRecord = loadMasterPasswordRecord();
    const password = normalizeMasterPassword(authPassword);
    let key: CryptoKey | null = null;

    if (typeof storedRecord === 'string') {
      if (password === storedRecord) {
        const migratedRecord = await createMasterPasswordRecord(storedRecord);
        saveMasterPasswordRecord(migratedRecord.record);
        key = migratedRecord.key;
      }
    } else if (storedRecord) {
      key = await verifyMasterPassword(password, storedRecord);
    }

    if (!key) {
      setAuthError('マスターパスワードが違います');
      return;
    }

    setEncryptionKey(key);
    await registerBiometricCredential();
    showOnly('manager');
    setAuthError('');
  };

  const handleWebAuthnAuth = async () => {
    if (!isBiometricAvailable || biometricAuthenticationInProgress.current) return;

    biometricAuthenticationInProgress.current = true;
    const authenticated = await authenticateWithBiometrics();
    biometricAuthenticationInProgress.current = false;

    if (!authenticated) {
      setAuthError('端末認証に失敗しました。マスターパスワードを入力してください');
      return;
    }

    // 復号鍵は現在のアプリ起動中だけメモリに保持する。
    if (encryptionKey) {
      showOnly('manager');
      setAuthError('');
    }
  };

  const clearAuthenticationData = () => {
    clearMasterPasswordRecord();
    clearBiometricCredential();
    setEncryptionKey(null);
  };

  const handleLogout = () => {
    clearAuthenticationData();
    showOnly('setup');
  };

  const handleClearAllData = async () => {
    await passwordDb.clearAllPasswords();
    clearAuthenticationData();
    goToHome();
  };

  const updateAutoLockSettings = (settings: AutoLockSettings) => {
    const nextSettings = toAutoLockSettings(settings);
    saveAutoLockSettings(nextSettings);
    setAutoLockSettings(nextSettings);
  };

  const setupBiometricAuthentication = () => registerBiometricCredential(true);

  const changeMasterPassword = async (currentPassword: string, newPassword: string, confirmation: string) => {
    const storedRecord = loadMasterPasswordRecord();
    if (!storedRecord || typeof storedRecord === 'string') return 'マスターパスワードのデータが古いため、再ログインしてください';

    const currentKey = await verifyMasterPassword(normalizeMasterPassword(currentPassword), storedRecord);
    if (!currentKey) return '現在のマスターパスワードが違います';

    const normalizedNewPassword = normalizeMasterPassword(newPassword);
    if (normalizedNewPassword.length < MIN_MASTER_PASSWORD_LENGTH) return `新しいマスターパスワードは${MIN_MASTER_PASSWORD_LENGTH}文字以上で設定してください`;
    if (normalizedNewPassword !== normalizeMasterPassword(confirmation)) return '確認用パスワードが一致しません';

    const { record, key } = await createMasterPasswordRecord(normalizedNewPassword);
    const entries = await passwordDb.getAllPasswords(currentKey);
    await passwordDb.replaceAllPasswords(
      entries.map(({ category, appName, userId, email, password, url, memo }) => ({ category, appName, userId, email, password, url, memo })),
      key,
    );
    saveMasterPasswordRecord(record);
    setEncryptionKey(key);
    return null;
  };

  return {
    showSetup,
    showHome,
    showPasswordAuth,
    showPasswordManager,
    masterPassword,
    confirmPassword,
    authPassword,
    setupError,
    authError,
    isBiometricAvailable,
    isBiometricSupported,
    encryptionKey,
    autoLockSettings,
    setMasterPassword,
    setConfirmPassword,
    setAuthPassword,
    goToHome,
    goToPasswordManager,
    handleSetup,
    handleAuth,
    handleWebAuthnAuth,
    handleLogout,
    handleClearAllData,
    updateAutoLockSettings,
    setupBiometricAuthentication,
    changeMasterPassword,
  };
};
