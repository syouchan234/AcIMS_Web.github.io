import PasswordManagerView from './password-manager/PasswordManagerView';
import { usePasswordManager } from './password-manager/usePasswordManager';
import type { AutoLockSettings } from '../hooks/useAppController';
import type { FloatingActionSettings } from '../services/appStorage';

interface PasswordManagerProps {
  encryptionKey: CryptoKey | null;
  onBack?: () => void;
  autoLockSettings: AutoLockSettings;
  onAutoLockSettingsChange: (settings: AutoLockSettings) => void;
  floatingActionSettings: FloatingActionSettings;
  onFloatingActionSettingsChange: (settings: FloatingActionSettings) => void;
  isBiometricSupported: boolean;
  onBiometricSetup: () => Promise<boolean>;
  onMasterPasswordChange: (currentPassword: string, newPassword: string, confirmation: string) => Promise<string | null>;
  onOpenTerms?: () => void;
}

const PasswordManager: React.FC<PasswordManagerProps> = ({ encryptionKey, onBack, autoLockSettings, onAutoLockSettingsChange, floatingActionSettings, onFloatingActionSettingsChange, isBiometricSupported, onBiometricSetup, onMasterPasswordChange, onOpenTerms }) => {
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
      floatingActionSettings={floatingActionSettings}
      onFloatingActionSettingsChange={onFloatingActionSettingsChange}
      isBiometricSupported={isBiometricSupported}
      onBiometricSetup={onBiometricSetup}
      onMasterPasswordChange={onMasterPasswordChange}
      onOpenTerms={onOpenTerms}
      {...passwordManager}
    />
  );
};

export default PasswordManager;
