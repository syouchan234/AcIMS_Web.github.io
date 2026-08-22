import PasswordManagerView from './password-manager/PasswordManagerView';
import { usePasswordManager } from './password-manager/usePasswordManager';
import type { AutoLockSettings } from '../hooks/useAppController';

interface PasswordManagerProps {
  onBack?: () => void;
  autoLockSettings: AutoLockSettings;
  onAutoLockSettingsChange: (settings: AutoLockSettings) => void;
  onMasterPasswordChange: (currentPassword: string, newPassword: string, confirmation: string) => string | null;
}

const PasswordManager: React.FC<PasswordManagerProps> = ({ onBack, autoLockSettings, onAutoLockSettingsChange, onMasterPasswordChange }) => {
  const {
    setFormData,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleDelete,
    handleImport,
    ...passwordManager
  } = usePasswordManager();

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
      onMasterPasswordChange={onMasterPasswordChange}
      {...passwordManager}
    />
  );
};

export default PasswordManager;
