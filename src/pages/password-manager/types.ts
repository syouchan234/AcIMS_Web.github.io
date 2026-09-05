import type { PasswordEntry } from '../../services/passwordDb';
import type { AutoLockSettings } from '../../hooks/useAppController';

export interface PasswordFormData {
  category: string;
  appName: string;
  userId: string;
  email: string;
  password: string;
  url: string;
  memo: string;
}

export interface PasswordManagerViewProps {
  onBack?: () => void;
  passwords: PasswordEntry[];
  loading: boolean;
  isModalOpen: boolean;
  editingId: number | null;
  formData: PasswordFormData;
  onOpenModal: (password?: PasswordEntry) => void;
  onCloseModal: () => void;
  onSave: () => void;
  onDelete: (id: number | undefined) => void;
  onFormDataChange: (formData: PasswordFormData) => void;
  onImport: (entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  autoLockSettings: AutoLockSettings;
  onAutoLockSettingsChange: (settings: AutoLockSettings) => void;
  isBiometricSupported: boolean;
  onBiometricSetup: () => Promise<boolean>;
  onMasterPasswordChange: (currentPassword: string, newPassword: string, confirmation: string) => Promise<string | null>;
  onOpenTerms?: () => void;
}
