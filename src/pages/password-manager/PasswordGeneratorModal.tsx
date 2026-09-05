import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonTitle, IonToggle, IonToolbar } from '@ionic/react';
import type { GeneratorSettings } from './passwordManagerUtils';
import { MAX_GENERATED_PASSWORD_LENGTH, MIN_GENERATED_PASSWORD_LENGTH } from './passwordManagerUtils';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  generatedPassword: string;
  settings: GeneratorSettings;
  onSettingsChange: (settings: GeneratorSettings) => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onUse: () => void;
  onClose: () => void;
}

// パスワード生成の設定と結果を一つのモーダルに閉じ込める。
const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({ isOpen, generatedPassword, settings, onSettingsChange, onRegenerate, onCopy, onUse, onClose }) => {
  const updateSetting = <K extends keyof GeneratorSettings>(key: K, value: GeneratorSettings[K]) => onSettingsChange({ ...settings, [key]: value });
  return <IonModal isOpen={isOpen} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>パスワード生成</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="generator-container"><p className="generated-password">{generatedPassword}</p><IonButton expand="block" fill="outline" onClick={onRegenerate}>再生成</IonButton><IonButton expand="block" fill="outline" onClick={onCopy}>コピー</IonButton><IonButton expand="block" onClick={onUse}>このパスワードを使用</IonButton>
      <div className="generator-settings"><h2>生成設定</h2><IonItem className="generator-length-item"><IonLabel>文字数（1〜256）</IonLabel><IonInput aria-label="生成するパスワードの文字数" inputMode="numeric" max={MAX_GENERATED_PASSWORD_LENGTH} min={MIN_GENERATED_PASSWORD_LENGTH} onIonInput={(event) => updateSetting('length', Math.min(MAX_GENERATED_PASSWORD_LENGTH, Math.max(MIN_GENERATED_PASSWORD_LENGTH, Number(event.detail.value) || MIN_GENERATED_PASSWORD_LENGTH)))} type="number" value={settings.length} /></IonItem><IonItem><IonLabel>英大文字</IonLabel><IonToggle checked={settings.uppercase} onIonChange={(event) => updateSetting('uppercase', event.detail.checked)} /></IonItem><IonItem><IonLabel>英小文字</IonLabel><IonToggle checked={settings.lowercase} onIonChange={(event) => updateSetting('lowercase', event.detail.checked)} /></IonItem><IonItem><IonLabel>数字</IonLabel><IonToggle checked={settings.numbers} onIonChange={(event) => updateSetting('numbers', event.detail.checked)} /></IonItem><IonItem><IonLabel>記号</IonLabel><IonToggle checked={settings.symbols} onIonChange={(event) => updateSetting('symbols', event.detail.checked)} /></IonItem><IonItem><IonLabel>紛らわしい文字を除外</IonLabel><IonToggle checked={settings.excludeAmbiguous} onIonChange={(event) => updateSetting('excludeAmbiguous', event.detail.checked)} /></IonItem></div>
    </div></IonContent>
  </IonModal>;
};

export default PasswordGeneratorModal;
