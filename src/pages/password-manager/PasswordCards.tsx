import { IonButton, IonIcon } from '@ionic/react';
import { copyOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import type { ReactNode } from 'react';
import type { PasswordEntry } from '../../services/passwordDb';
import { getPasswordMask, truncateText } from './passwordManagerUtils';

interface PasswordCardsProps {
  passwords: PasswordEntry[];
  visiblePasswordIds: Set<number>;
  onTogglePasswordVisibility: (id: number | undefined) => void;
  onCopy: (value: string, label: string) => void;
  onOpenDetail: (password: PasswordEntry) => void;
  onEdit: (password: PasswordEntry) => void;
  onDelete: (id: number | undefined) => void;
}

// スマホ向けカード表示。PC 表と同じ操作を別レイアウトで提供する。
const PasswordCards: React.FC<PasswordCardsProps> = ({ passwords, visiblePasswordIds, onTogglePasswordVisibility, onCopy, onOpenDetail, onEdit, onDelete }) => (
  <div className="password-cards">{passwords.map((password) => {
    const isMasked = !(password.id !== undefined && visiblePasswordIds.has(password.id));
    const renderField = (label: string, value: string, content?: ReactNode, maxLength = 32, emptyText = '未登録') => <li><strong>{label}</strong><span className="password-card-value ellipsis-text">{content ?? (value ? truncateText(value, maxLength) : emptyText)}</span><IonButton aria-label={`${label}をコピー`} disabled={!value} fill="clear" onClick={() => onCopy(value, label)} size="small" title={`${label}をコピー`}><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></li>;
    return <article className="password-card" key={password.id}>
      <div className="password-card-header"><h2>{password.appName || '名称未設定'}</h2></div>
      <ul className="password-card-fields">
        {renderField('カテゴリ', password.category)}
        {renderField('ID', password.userId)}
        {renderField('メールアドレス', password.email)}
        <li className="password-card-password"><strong>パスワード</strong><span className="password-card-value ellipsis-text">{isMasked ? <span className="masked-password">{getPasswordMask(password.password)}</span> : truncateText(password.password, 32)}</span><IonButton aria-label={isMasked ? 'パスワードのマスクを解除' : 'パスワードをマスク'} aria-pressed={!isMasked} fill="clear" onClick={() => onTogglePasswordVisibility(password.id)} size="small" title={isMasked ? 'マスク解除' : 'マスク'}><IonIcon icon={isMasked ? eyeOutline : eyeOffOutline} slot="icon-only" /></IonButton><IonButton aria-label="パスワードをコピー" disabled={!password.password} fill="clear" onClick={() => onCopy(password.password, 'パスワード')} size="small" title="パスワードをコピー"><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></li>
        {renderField('URL', password.url, password.url ? <a href={password.url} rel="noopener noreferrer" target="_blank">{truncateText(password.url, 32)}</a> : undefined)}
        {renderField('備考', password.memo, undefined, 256, '')}
      </ul>
      <div className="password-card-actions"><IonButton fill="clear" onClick={() => onOpenDetail(password)}>詳細</IonButton><IonButton fill="clear" onClick={() => onEdit(password)}>編集</IonButton><IonButton color="danger" fill="clear" onClick={() => onDelete(password.id)}>削除</IonButton></div>
    </article>;
  })}</div>
);

export default PasswordCards;
