import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonTitle, IonToggle, IonToolbar } from '@ionic/react';
import type { AutoLockSettings } from '../../hooks/useAppController';
import ProductLinks from '../../components/ProductLinks';

interface SettingsModalProps {
  isOpen: boolean;
  autoLockDraft: AutoLockSettings;
  isBiometricSupported: boolean;
  currentMasterPassword: string;
  newMasterPassword: string;
  masterPasswordConfirmation: string;
  onAutoLockDraftChange: (settings: AutoLockSettings) => void;
  onCurrentMasterPasswordChange: (value: string) => void;
  onNewMasterPasswordChange: (value: string) => void;
  onMasterPasswordConfirmationChange: (value: string) => void;
  onExport: () => void;
  onImport: () => void;
  onSaveAutoLock: () => void;
  onChangeMasterPassword: () => void;
  onBiometricSetup: () => void;
  onOpenTerms: () => void;
  onClose: () => void;
}

// アプリ設定はデータ操作、認証設定、自動ロックのまとまりで構成する。
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, autoLockDraft, isBiometricSupported, currentMasterPassword, newMasterPassword, masterPasswordConfirmation, onAutoLockDraftChange, onCurrentMasterPasswordChange, onNewMasterPasswordChange, onMasterPasswordConfirmationChange, onExport, onImport, onSaveAutoLock, onChangeMasterPassword, onBiometricSetup, onOpenTerms, onClose }) => (
  <IonModal isOpen={isOpen} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>設定</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="settings-container">
      <h2>データ</h2><p>データはこの端末のアプリ内に保存されます。エクスポートやインポートは設定画面から行えます。</p><IonButton expand="block" fill="outline" onClick={onExport}>データをエクスポート</IonButton><IonButton expand="block" fill="outline" onClick={onImport}>データをインポート</IonButton>
      <h2>マスターパスワードの変更</h2><IonItem><IonLabel position="stacked">現在のパスワード</IonLabel><IonInput onIonInput={(event) => onCurrentMasterPasswordChange(event.detail.value ?? '')} type="password" value={currentMasterPassword} /></IonItem><IonItem><IonLabel position="stacked">新しいパスワード</IonLabel><IonInput onIonInput={(event) => onNewMasterPasswordChange(event.detail.value ?? '')} type="password" value={newMasterPassword} /></IonItem><IonItem><IonLabel position="stacked">新しいパスワード（確認）</IonLabel><IonInput onIonInput={(event) => onMasterPasswordConfirmationChange(event.detail.value ?? '')} type="password" value={masterPasswordConfirmation} /></IonItem><IonButton expand="block" fill="outline" onClick={onChangeMasterPassword}>マスターパスワードを変更</IonButton>
      {isBiometricSupported && <><h2>生体認証</h2><p>このスマホで生体認証を使ってロックを解除します。設定し直すと、現在の端末認証情報を更新できます。</p><IonButton expand="block" fill="outline" onClick={onBiometricSetup}>生体認証を設定する</IonButton></>}
      <div className="auto-lock-section"><h2>自動ロック</h2><IonItem className="auto-lock-toggle-item"><IonLabel>自動ロックを有効にする</IonLabel><IonToggle checked={autoLockDraft.enabled} onIonChange={(event) => onAutoLockDraftChange({ ...autoLockDraft, enabled: event.detail.checked })} /></IonItem><IonItem className="auto-lock-duration-item" disabled={!autoLockDraft.enabled}><IonLabel>ロックまでの時間（分）</IonLabel><IonInput inputMode="numeric" max="60" min="1" onIonInput={(event) => onAutoLockDraftChange({ ...autoLockDraft, minutes: Number(event.detail.value) || 1 })} type="number" value={autoLockDraft.minutes} /></IonItem><IonButton expand="block" onClick={onSaveAutoLock}>自動ロック設定を保存</IonButton></div>
      <a className="terms-link-button" href="#terms" onClick={(event) => { event.preventDefault(); onOpenTerms(); }} role="link">利用規約</a>
      <ProductLinks />
    </div></IonContent>
  </IonModal>
);

export default SettingsModal;
