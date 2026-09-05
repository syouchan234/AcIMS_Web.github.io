import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import type { PasswordFormData } from './types';

interface PasswordFormModalProps {
  isOpen: boolean;
  editingId: number | null;
  formData: PasswordFormData;
  categories: string[];
  isPasswordVisible: boolean;
  onFormDataChange: (formData: PasswordFormData) => void;
  onTogglePasswordVisibility: () => void;
  onOpenGenerator: () => void;
  onSave: () => void;
  onClose: () => void;
}

// 登録・編集フォームは入力状態を親で保持し、入力イベントだけを返す。
const PasswordFormModal: React.FC<PasswordFormModalProps> = ({ isOpen, editingId, formData, categories, isPasswordVisible, onFormDataChange, onTogglePasswordVisibility, onOpenGenerator, onSave, onClose }) => {
  const updateField = (field: keyof PasswordFormData, value: string) => onFormDataChange({ ...formData, [field]: value });
  return <IonModal isOpen={isOpen} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>{editingId !== null ? 'パスワード編集' : 'パスワード新規追加'}</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="form-container">
      <IonItem><IonLabel position="stacked">カテゴリ *</IonLabel><IonInput value={formData.category} onIonInput={(event) => updateField('category', event.detail.value || '')} placeholder="例: メール、SNS、銀行" /></IonItem>
      {categories.length > 0 && <IonItem><IonLabel>登録済みカテゴリから選択</IonLabel><IonSelect aria-label="登録済みカテゴリから選択" interface="popover" onIonChange={(event) => updateField('category', event.detail.value)} placeholder="カテゴリを選択"><IonSelectOption value="">選択しない</IonSelectOption>{categories.map((category) => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}</IonSelect></IonItem>}
      <IonItem><IonLabel position="stacked">アプリサイト名 *</IonLabel><IonInput value={formData.appName} onIonInput={(event) => updateField('appName', event.detail.value || '')} placeholder="例: Gmail、Twitter" /></IonItem>
      <IonItem><IonLabel position="stacked">ID</IonLabel><IonInput value={formData.userId} onIonInput={(event) => updateField('userId', event.detail.value || '')} placeholder="ユーザーID" /></IonItem>
      <IonItem><IonLabel position="stacked">メールアドレス</IonLabel><IonInput value={formData.email} onIonInput={(event) => updateField('email', event.detail.value || '')} placeholder="メールアドレス" type="email" /></IonItem>
      <IonItem><IonLabel position="stacked">パスワード</IonLabel><IonInput value={formData.password} onIonInput={(event) => updateField('password', event.detail.value || '')} placeholder="パスワード" type={isPasswordVisible ? 'text' : 'password'} /><IonButton aria-label={isPasswordVisible ? 'パスワードを非表示' : 'パスワードを表示'} fill="clear" onClick={onTogglePasswordVisibility} slot="end" title={isPasswordVisible ? '非表示' : '表示'}><IonIcon icon={isPasswordVisible ? eyeOffOutline : eyeOutline} slot="icon-only" /></IonButton></IonItem>
      {editingId === null && <IonButton className="generate-password-button" fill="outline" onClick={onOpenGenerator}>パスワードを生成</IonButton>}
      <IonItem><IonLabel position="stacked">URL</IonLabel><IonInput value={formData.url} onIonInput={(event) => updateField('url', event.detail.value || '')} placeholder="https://example.com" type="url" /></IonItem>
      <IonItem><IonLabel position="stacked">備考</IonLabel><IonTextarea autoGrow value={formData.memo} onIonInput={(event) => updateField('memo', event.detail.value || '')} placeholder="メモ" /></IonItem>
      <div className="form-actions"><IonButton color="primary" expand="block" onClick={onSave}>保存</IonButton><IonButton color="secondary" expand="block" onClick={onClose}>キャンセル</IonButton></div>
    </div></IonContent>
  </IonModal>;
};

export default PasswordFormModal;
