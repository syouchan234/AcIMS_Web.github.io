import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { copyOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import type { PasswordEntry } from '../../services/passwordDb';
import { getPasswordMask } from './passwordManagerUtils';

interface DetailModalProps {
  password: PasswordEntry | null;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
  onCopy: (value: string, label: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

// 詳細表示ではパスワードの一時表示状態をこのモーダルに閉じ込める。
const DetailModal: React.FC<DetailModalProps> = ({ password, isPasswordVisible, onTogglePasswordVisibility, onCopy, onEdit, onDelete, onClose }) => {
  const renderField = (label: string, value: string) => <div className="detail-field"><h3>{label}</h3><div className="detail-value"><p>{value || '未登録'}</p><IonButton aria-label={`${label}をコピー`} disabled={!value} fill="clear" onClick={() => onCopy(value, label)} size="small" title={`${label}をコピー`}><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></div></div>;
  return <IonModal className="detail-modal" isOpen={password !== null} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>詳細</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="detail-modal-content">{password && <><>{renderField('カテゴリ', password.category)}</><>{renderField('アプリサイト名', password.appName)}</><>{renderField('ID', password.userId)}</><>{renderField('メールアドレス', password.email)}</><div className="detail-field"><h3>パスワード</h3><div className="detail-password-value"><p>{isPasswordVisible ? password.password || '未登録' : password.password ? getPasswordMask(password.password) : '未登録'}</p><IonButton aria-label={isPasswordVisible ? 'パスワードをマスク' : 'パスワードのマスクを解除'} fill="clear" onClick={onTogglePasswordVisibility} size="small" title={isPasswordVisible ? 'マスク' : 'マスク解除'}><IonIcon icon={isPasswordVisible ? eyeOffOutline : eyeOutline} slot="icon-only" /></IonButton><IonButton aria-label="パスワードをコピー" disabled={!password.password} fill="clear" onClick={() => onCopy(password.password, 'パスワード')} size="small" title="パスワードをコピー"><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></div></div><>{renderField('URL', password.url)}</><div className="detail-field"><h3>備考</h3><p>{password.memo}</p></div><div className="detail-actions"><IonButton expand="block" fill="outline" onClick={onEdit}>編集</IonButton><IonButton color="danger" expand="block" fill="outline" onClick={onDelete}>削除</IonButton></div></>}</div></IonContent>
  </IonModal>;
};

export default DetailModal;
