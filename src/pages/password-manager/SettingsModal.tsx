import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar } from '@ionic/react';
import type { AutoLockSettings } from '../../hooks/useAppController';
import type { FloatingActionSettings } from '../../services/appStorage';
import ProductLinks from '../../components/ProductLinks';

interface SettingsModalProps {
  isOpen: boolean;
  autoLockDraft: AutoLockSettings;
  isBiometricSupported: boolean;
  currentMasterPassword: string;
  newMasterPassword: string;
  masterPasswordConfirmation: string;
  onAutoLockChange: (settings: AutoLockSettings) => void;
  floatingActionSettings: FloatingActionSettings;
  onFloatingActionSettingsChange: (settings: FloatingActionSettings) => void;
  onCurrentMasterPasswordChange: (value: string) => void;
  onNewMasterPasswordChange: (value: string) => void;
  onMasterPasswordConfirmationChange: (value: string) => void;
  onExport: () => void;
  onImport: () => void;
  onChangeMasterPassword: () => void;
  onBiometricSetup: () => void;
  onOpenTerms: () => void;
  onClose: () => void;
}

// アプリ設定はデータ操作、認証設定、自動ロックのまとまりで構成する。
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, autoLockDraft, isBiometricSupported, currentMasterPassword, newMasterPassword, masterPasswordConfirmation, onAutoLockChange, floatingActionSettings, onFloatingActionSettingsChange, onCurrentMasterPasswordChange, onNewMasterPasswordChange, onMasterPasswordConfirmationChange, onExport, onImport, onChangeMasterPassword, onBiometricSetup, onOpenTerms, onClose }) => (
  <IonModal isOpen={isOpen} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>設定</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="settings-container">
      <h2>データ</h2><p>データはこの端末のアプリ内に保存されます。エクスポートやインポートは設定画面から行えます。</p><IonButton expand="block" fill="outline" onClick={onExport}>データをエクスポート</IonButton><IonButton expand="block" fill="outline" onClick={onImport}>データをインポート</IonButton>
      <h2>マスターパスワードの変更</h2><IonItem><IonLabel position="stacked">現在のパスワード</IonLabel><IonInput onIonInput={(event) => onCurrentMasterPasswordChange(event.detail.value ?? '')} type="password" value={currentMasterPassword} /></IonItem><IonItem><IonLabel position="stacked">新しいパスワード</IonLabel><IonInput onIonInput={(event) => onNewMasterPasswordChange(event.detail.value ?? '')} type="password" value={newMasterPassword} /></IonItem><IonItem><IonLabel position="stacked">新しいパスワード（確認）</IonLabel><IonInput onIonInput={(event) => onMasterPasswordConfirmationChange(event.detail.value ?? '')} type="password" value={masterPasswordConfirmation} /></IonItem><IonButton expand="block" fill="outline" onClick={onChangeMasterPassword}>マスターパスワードを変更</IonButton>
      {isBiometricSupported && <><h2>生体認証</h2><p>このスマホで生体認証を使ってロックを解除します。設定し直すと、現在の端末認証情報を更新できます。</p><IonButton expand="block" fill="outline" onClick={onBiometricSetup}>生体認証を設定する</IonButton></>}
      <div className="auto-lock-section"><h2>自動ロック</h2><div className="settings-toggle-row"><IonLabel>自動ロックを有効にする</IonLabel><IonToggle checked={autoLockDraft.enabled} onIonChange={(event) => onAutoLockChange({ ...autoLockDraft, enabled: event.detail.checked })} /></div><div className="auto-lock-duration-row"><IonLabel>ロックまでの時間（分）</IonLabel><IonSelect aria-label="ロックまでの時間を選択" className="auto-lock-duration-select" disabled={!autoLockDraft.enabled} interface="popover" onIonChange={(event) => onAutoLockChange({ ...autoLockDraft, minutes: Number(event.detail.value) })} value={autoLockDraft.minutes}>{Array.from({ length: 60 }, (_, index) => index + 1).map((minutes) => <IonSelectOption key={minutes} value={minutes}>{minutes}</IonSelectOption>)}</IonSelect></div></div>
      <div className="floating-action-settings"><h2>スクロールボタン</h2><div className="settings-toggle-row"><IonLabel>スクロールボタンを表示</IonLabel><IonToggle checked={floatingActionSettings.enabled} onIonChange={(event) => onFloatingActionSettingsChange({ ...floatingActionSettings, enabled: event.detail.checked })} /></div>{floatingActionSettings.enabled && <div className="floating-action-details"><p>表示するボタンを個別に設定できます。</p><div className="settings-toggle-row"><IonLabel>上へ戻るボタンを表示</IonLabel><IonToggle checked={floatingActionSettings.showScrollTop} onIonChange={(event) => onFloatingActionSettingsChange({ ...floatingActionSettings, showScrollTop: event.detail.checked })} /></div><div className="settings-toggle-row"><IonLabel>下へ移動ボタンを表示</IonLabel><IonToggle checked={floatingActionSettings.showScrollBottom} onIonChange={(event) => onFloatingActionSettingsChange({ ...floatingActionSettings, showScrollBottom: event.detail.checked })} /></div></div>}</div>
      <a className="terms-link-button" href="#terms" onClick={(event) => { event.preventDefault(); onOpenTerms(); }} role="link">利用規約</a>
      <ProductLinks />
    </div></IonContent>
  </IonModal>
);

export default SettingsModal;
