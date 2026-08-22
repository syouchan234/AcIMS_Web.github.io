import { useCallback, useEffect, useRef, useState } from 'react';
import { passwordDb } from '../services/passwordDb';

const MASTER_PASSWORD_KEY = 'acims_master_password';
const AUTO_LOCK_SETTINGS_KEY = 'acims_auto_lock_settings';

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
  const hasMasterPassword = () => Boolean(localStorage.getItem(MASTER_PASSWORD_KEY));
  const [showSetup, setShowSetup] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [showPasswordManager, setShowPasswordManager] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [authError, setAuthError] = useState('');
  const [autoLockSettings, setAutoLockSettings] = useState<AutoLockSettings>(loadAutoLockSettings);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToHome = () => {
    setShowSetup(false); setShowHome(true); setShowPasswordAuth(false); setShowPasswordManager(false);
    setMasterPassword(''); setConfirmPassword(''); setAuthPassword(''); setSetupError(''); setAuthError('');
  };
  const goToPasswordAuth = () => {
    setShowSetup(false); setShowHome(false); setShowPasswordAuth(true); setShowPasswordManager(false);
    setAuthPassword(''); setAuthError('');
  };
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
  const handleSetup = () => {
    const trimmedPassword = masterPassword.trim();
    if (trimmedPassword.length < 4) { setSetupError('マスターパスワードは4文字以上で設定してください'); return; }
    if (trimmedPassword !== confirmPassword.trim()) { setSetupError('確認用パスワードが一致しません'); return; }
    localStorage.setItem(MASTER_PASSWORD_KEY, trimmedPassword);
    setShowSetup(false); setShowHome(false); setShowPasswordManager(true); setSetupError('');
  };
  const handleAuth = () => {
    if (authPassword === (localStorage.getItem(MASTER_PASSWORD_KEY) || '')) {
      setShowPasswordAuth(false); setShowPasswordManager(true); setAuthError(''); return;
    }
    setAuthError('マスターパスワードが違います');
  };
  const handleLogout = () => {
    localStorage.removeItem(MASTER_PASSWORD_KEY);
    setShowSetup(true); setShowHome(false); setShowPasswordAuth(false); setShowPasswordManager(false);
  };
  const handleClearAllData = async () => {
    await passwordDb.clearAllPasswords();
    localStorage.removeItem(MASTER_PASSWORD_KEY);
    goToHome();
  };
  const updateAutoLockSettings = (settings: AutoLockSettings) => {
    const nextSettings = { enabled: settings.enabled, minutes: Math.min(60, Math.max(1, settings.minutes || 1)) };
    localStorage.setItem(AUTO_LOCK_SETTINGS_KEY, JSON.stringify(nextSettings));
    setAutoLockSettings(nextSettings);
  };
  const changeMasterPassword = (currentPassword: string, newPassword: string, confirmation: string) => {
    if (currentPassword !== localStorage.getItem(MASTER_PASSWORD_KEY)) return '現在のマスターパスワードが違います';
    if (newPassword.trim().length < 4) return '新しいマスターパスワードは4文字以上で設定してください';
    if (newPassword !== confirmation) return '確認用パスワードが一致しません';
    localStorage.setItem(MASTER_PASSWORD_KEY, newPassword);
    return null;
  };

  return {
    showSetup, showHome, showPasswordAuth, showPasswordManager,
    masterPassword, confirmPassword, authPassword, setupError, authError,
    setMasterPassword, setConfirmPassword, setAuthPassword,
    goToHome, goToPasswordManager, handleSetup, handleAuth, handleLogout, handleClearAllData,
    autoLockSettings, updateAutoLockSettings, changeMasterPassword,
  };
};
