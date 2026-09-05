import PasswordManagerView from './password-manager/PasswordManagerView';
import { usePasswordManager } from './password-manager/usePasswordManager';
import type { AutoLockSettings } from '../hooks/useAppController';

interface PasswordManagerProps {
  encryptionKey: CryptoKey | null;
  onBack?: () => void;
  autoLockSettings: AutoLockSettings;
  onAutoLockSettingsChange: (settings: AutoLockSettings) => void;
  isBiometricSupported: boolean;
  onBiometricSetup: () => Promise<boolean>;
  onMasterPasswordChange: (currentPassword: string, newPassword: string, confirmation: string) => Promise<string | null>;
  onOpenTerms?: () => void;
}

const PasswordManager: React.FC<PasswordManagerProps> = ({ encryptionKey, onBack, autoLockSettings, onAutoLockSettingsChange, isBiometricSupported, onBiometricSetup, onMasterPasswordChange, onOpenTerms }) => {
  const {
    setFormData,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleDelete,
    handleImport,
    ...passwordManager
  } = usePasswordManager(encryptionKey);

  return (
    <PasswordManagerView
      onBack={onBack}
      onFormDataChange={setFormData}
      onOpenModal={handleOpenModal}
      onCloseModal={handleCloseModal}
      onSave={handleSave}
      onDelete={handleDelete}
      onImport={handleImport}
      autoLockSettings={autoLockSettings}
      onAutoLockSettingsChange={onAutoLockSettingsChange}
      isBiometricSupported={isBiometricSupported}
      onBiometricSetup={onBiometricSetup}
      onMasterPasswordChange={onMasterPasswordChange}
      onOpenTerms={onOpenTerms}
      {...passwordManager}
    />
  );
};

export default PasswordManager;
