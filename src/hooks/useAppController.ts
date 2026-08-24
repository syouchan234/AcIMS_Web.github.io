import { useCallback, useEffect, useRef, useState } from 'react';
import { passwordDb } from '../services/passwordDb';
import { createMasterPasswordRecord, type StoredMasterPassword, verifyMasterPassword } from '../services/security';

const MASTER_PASSWORD_KEY = 'acims_master_password';
const AUTO_LOCK_SETTINGS_KEY = 'acims_auto_lock_settings';
const WEBAUTHN_CREDENTIAL_KEY = 'acims_webauthn_credential';

const normalizeMasterPassword = (password: string) => password.trim();

const toBase64Url = (value: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(value)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const createWebAuthnChallenge = () => crypto.getRandomValues(new Uint8Array(32));

const isWebAuthnAvailable = () => typeof window !== 'undefined'
  && !!window.PublicKeyCredential
  && !!navigator.credentials;

// WebAuthn は PC の Windows Hello などでも利用できるため、画面幅だけでは
// スマホ版に限定できない。iPadOS は Mac の User-Agent を返すことがあるので、
// タッチポイントもあわせて判定する。
const isSmartphone = () => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent;
  return /Android|iPhone|iPod|IEMobile|Opera Mini/i.test(userAgent)
    || (/iPad|Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
};

export interface AutoLockSettings {
  enabled: boolean;
  minutes: number;
}

const loadAutoLockSettings = (): AutoLockSettings => {
  try {
    const saved = localStorage.getItem(AUTO_LOCK_SETTINGS_KEY);
    return saved ? { enabled: false, minutes: 5, ...JSON.parse(saved) } : { enabled: false, minutes: 5 };
  } catch {
    return { enabled: false, minutes: 5 };
  }
};

export const useAppController = () => {
  const getStoredMasterPassword = (): StoredMasterPassword | string | null => {
    const stored = localStorage.getItem(MASTER_PASSWORD_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored) as StoredMasterPassword; } catch { return stored; }
  };
  const hasMasterPassword = () => Boolean(getStoredMasterPassword());
  const [showSetup, setShowSetup] = useState(false);
  const [showHome, setShowHome] = useState(() => !hasMasterPassword());
  const [showPasswordAuth, setShowPasswordAuth] = useState(hasMasterPassword);
  const [showPasswordManager, setShowPasswordManager] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricSupported] = useState(() => isSmartphone() && isWebAuthnAvailable());
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [autoLockSettings, setAutoLockSettings] = useState<AutoLockSettings>(loadAutoLockSettings);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webAuthnInProgress = useRef(false);

  const goToHome = () => {
    setShowSetup(false); setShowHome(true); setShowPasswordAuth(false); setShowPasswordManager(false);
    setMasterPassword(''); setConfirmPassword(''); setAuthPassword(''); setSetupError(''); setAuthError('');
  };
  const goToPasswordAuth = () => {
    setShowSetup(false); setShowHome(false); setShowPasswordAuth(true); setShowPasswordManager(false);
    setAuthPassword(''); setAuthError('');
  };
  useEffect(() => {
    if (!showPasswordAuth || !isSmartphone() || !isWebAuthnAvailable() || !localStorage.getItem(WEBAUTHN_CREDENTIAL_KEY)) {
      setIsBiometricAvailable(false);
      return undefined;
    }
    let active = true;
    const platformAuthenticator = window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
    if (!platformAuthenticator) {
      setIsBiometricAvailable(true);
      return undefined;
    }
    void platformAuthenticator.call(window.PublicKeyCredential).then((available) => {
      if (active) setIsBiometricAvailable(available);
    }).catch(() => {
      if (active) setIsBiometricAvailable(false);
    });
    return () => { active = false; };
  }, [showPasswordAuth]);
  const lockPasswordManager = useCallback(() => {
    setShowSetup(false); setShowHome(false); setShowPasswordAuth(true); setShowPasswordManager(false);
    setAuthPassword(''); setAuthError('');
  }, []);
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    if (!showPasswordManager || !autoLockSettings.enabled) return;
    autoLockTimer.current = setTimeout(lockPasswordManager, autoLockSettings.minutes * 60 * 1000);
  }, [autoLockSettings, lockPasswordManager, showPasswordManager]);
  useEffect(() => {
    resetAutoLockTimer();
    if (!showPasswordManager || !autoLockSettings.enabled) return undefined;
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetAutoLockTimer));
    return () => {
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
      events.forEach((eventName) => window.removeEventListener(eventName, resetAutoLockTimer));
    };
  }, [autoLockSettings.enabled, resetAutoLockTimer, showPasswordManager]);
  const goToPasswordManager = () => {
    if (!hasMasterPassword()) {
      setShowSetup(true); setShowHome(false); setShowPasswordAuth(false); setShowPasswordManager(false);
      return;
    }
    goToPasswordAuth();
  };
  const handleSetup = async () => {
    const trimmedPassword = normalizeMasterPassword(masterPassword);
    if (trimmedPassword.length < 4) { setSetupError('マスターパスワードは4文字以上で設定してください'); return; }
    if (trimmedPassword !== normalizeMasterPassword(confirmPassword)) { setSetupError('確認用パスワードが一致しません'); return; }
    const { record, key } = await createMasterPasswordRecord(trimmedPassword);
    localStorage.setItem(MASTER_PASSWORD_KEY, JSON.stringify(record));
    setEncryptionKey(key);
    void registerWebAuthnCredential();
    setShowSetup(false); setShowHome(false); setShowPasswordManager(true); setSetupError('');
  };
  const handleAuth = async () => {
    const stored = getStoredMasterPassword();
    const normalizedPassword = normalizeMasterPassword(authPassword);
    let key: CryptoKey | null = null;
    if (typeof stored === 'string') {
      if (normalizedPassword === stored) {
        const created = await createMasterPasswordRecord(stored);
        localStorage.setItem(MASTER_PASSWORD_KEY, JSON.stringify(created.record));
        key = created.key;
      }
    } else if (stored) {
      try { key = await verifyMasterPassword(normalizedPassword, stored); } catch { key = null; }
    }
    if (key) {
      setEncryptionKey(key);
      await registerWebAuthnCredential();
      setShowPasswordAuth(false); setShowPasswordManager(true); setAuthError(''); return;
    }
    setAuthError('マスターパスワードが違います');
  };
  const registerWebAuthnCredential = async (replaceExisting = false) => {
    if (!isSmartphone() || !isWebAuthnAvailable()) return false;
    if (!replaceExisting && localStorage.getItem(WEBAUTHN_CREDENTIAL_KEY)) return true;
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: createWebAuthnChallenge(),
          rp: { name: 'AcIMSWeb' },
          user: { id: createWebAuthnChallenge(), name: 'acims-user', displayName: 'AcIMSWeb ユーザー' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
          attestation: 'none',
        },
      });
      if (credential instanceof PublicKeyCredential) {
        localStorage.setItem(WEBAUTHN_CREDENTIAL_KEY, toBase64Url(credential.rawId));
        return true;
      }
    } catch {
      // パスキー登録をキャンセルしても、マスターパスワード認証は利用できる
    }
    return false;
  };
  const setupBiometricAuthentication = async () => registerWebAuthnCredential(true);
  const handleWebAuthnAuth = async () => {
    if (!isSmartphone() || !isBiometricAvailable || webAuthnInProgress.current) return;
    const credentialId = localStorage.getItem(WEBAUTHN_CREDENTIAL_KEY);
    if (!credentialId) {
      setAuthError('先にパスキーを登録してください');
      return;
    }
    webAuthnInProgress.current = true;
    try {
      await navigator.credentials.get({
        publicKey: {
          challenge: createWebAuthnChallenge(),
          allowCredentials: [{ id: fromBase64Url(credentialId), type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (!encryptionKey) return;
      setShowPasswordAuth(false); setShowPasswordManager(true); setAuthError('');
    } catch {
      setAuthError('端末認証に失敗しました。マスターパスワードを入力してください');
    } finally {
      webAuthnInProgress.current = false;
    }
  };
  const handleLogout = () => {
    localStorage.removeItem(MASTER_PASSWORD_KEY);
    localStorage.removeItem(WEBAUTHN_CREDENTIAL_KEY);
    setShowSetup(true); setShowHome(false); setShowPasswordAuth(false); setShowPasswordManager(false);
  };
  const handleClearAllData = async () => {
    await passwordDb.clearAllPasswords();
    localStorage.removeItem(MASTER_PASSWORD_KEY);
    localStorage.removeItem(WEBAUTHN_CREDENTIAL_KEY);
    goToHome();
  };
  const updateAutoLockSettings = (settings: AutoLockSettings) => {
    const nextSettings = { enabled: settings.enabled, minutes: Math.min(60, Math.max(1, settings.minutes || 1)) };
    localStorage.setItem(AUTO_LOCK_SETTINGS_KEY, JSON.stringify(nextSettings));
    setAutoLockSettings(nextSettings);
  };
  const changeMasterPassword = async (currentPassword: string, newPassword: string, confirmation: string) => {
    const normalizedCurrentPassword = normalizeMasterPassword(currentPassword);
    const normalizedNewPassword = normalizeMasterPassword(newPassword);
    const stored = getStoredMasterPassword();
    if (!stored || typeof stored === 'string') return 'マスターパスワードのデータが古いため、再ログインしてください';
    const currentKey = await verifyMasterPassword(normalizedCurrentPassword, stored);
    if (!currentKey) return '現在のマスターパスワードが違います';
    if (normalizedNewPassword.length < 4) return '新しいマスターパスワードは4文字以上で設定してください';
    if (normalizedNewPassword !== normalizeMasterPassword(confirmation)) return '確認用パスワードが一致しません';
    const { record, key } = await createMasterPasswordRecord(normalizedNewPassword);
    const entries = await passwordDb.getAllPasswords(currentKey);
    await passwordDb.replaceAllPasswords(entries.map(({ category, appName, userId, email, password, url, memo }) => ({ category, appName, userId, email, password, url, memo })), key);
    localStorage.setItem(MASTER_PASSWORD_KEY, JSON.stringify(record));
    setEncryptionKey(key);
    return null;
  };

  return {
    showSetup, showHome, showPasswordAuth, showPasswordManager,
    masterPassword, confirmPassword, authPassword, setupError, authError, isBiometricAvailable, isBiometricSupported, encryptionKey,
    setMasterPassword, setConfirmPassword, setAuthPassword,
    goToHome, goToPasswordManager, handleSetup, handleAuth, handleWebAuthnAuth, handleLogout, handleClearAllData,
    autoLockSettings, updateAutoLockSettings, setupBiometricAuthentication, changeMasterPassword,
  };
};
