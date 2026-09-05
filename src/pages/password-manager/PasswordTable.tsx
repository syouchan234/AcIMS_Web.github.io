import { IonButton, IonIcon } from '@ionic/react';
import { copyOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import type { PasswordEntry } from '../../services/passwordDb';
import CopyableCell from './CopyableCell';
import { getPasswordMask, truncateText } from './passwordManagerUtils';

interface PasswordTableProps {
  passwords: PasswordEntry[];
  visiblePasswordIds: Set<number>;
  allPasswordsVisible: boolean;
  onTogglePasswordVisibility: (id: number | undefined) => void;
  onToggleAllPasswordsVisibility: () => void;
  onCopy: (value: string, label: string) => void;
  onOpenDetail: (password: PasswordEntry) => void;
  onEdit: (password: PasswordEntry) => void;
  onDelete: (id: number | undefined) => void;
}

// PC 向けの表形式表示。表示状態の管理は親から受け取り、描画だけを担当する。
const PasswordTable: React.FC<PasswordTableProps> = ({ passwords, visiblePasswordIds, allPasswordsVisible, onTogglePasswordVisibility, onToggleAllPasswordsVisibility, onCopy, onOpenDetail, onEdit, onDelete }) => (
  <div className="passwords-table"><table>
    <thead><tr><th>カテゴリ</th><th>アプリサイト名</th><th>ID</th><th>メールアドレス</th><th>パスワード <IonButton aria-label={allPasswordsVisible ? 'すべてのパスワードをマスク' : 'すべてのパスワードのマスクを解除'} className="toggle-all-button" fill="clear" onClick={onToggleAllPasswordsVisibility} size="small">{allPasswordsVisible ? 'すべて隠す' : 'すべて表示'}</IonButton></th><th>URL</th><th>備考</th><th>操作</th></tr></thead>
    <tbody>{passwords.map((password) => {
      const isMasked = !(password.id !== undefined && visiblePasswordIds.has(password.id));
      const maskedPassword = isMasked ? getPasswordMask(password.password) : password.password;
      return <tr key={password.id}>
        <CopyableCell label="カテゴリ" onCopy={onCopy} value={password.category} />
        <CopyableCell label="アプリサイト名" onCopy={onCopy} value={password.appName} />
        <CopyableCell label="ID" onCopy={onCopy} value={password.userId} />
        <CopyableCell label="メールアドレス" onCopy={onCopy} value={password.email} />
        <td className="password-cell"><div className="copyable-cell"><span className="copyable-cell-value ellipsis-text">{truncateText(maskedPassword, 32)}</span><IonButton aria-label={isMasked ? 'パスワードのマスクを解除' : 'パスワードをマスク'} aria-pressed={!isMasked} className="copy-button" fill="clear" onClick={() => onTogglePasswordVisibility(password.id)} size="small" title={isMasked ? 'マスク解除' : 'マスク'}><IonIcon icon={isMasked ? eyeOutline : eyeOffOutline} slot="icon-only" /></IonButton><IonButton aria-label="パスワードをコピー" className="copy-button" disabled={!password.password} fill="clear" onClick={() => onCopy(password.password, 'パスワード')} size="small" title="パスワードをコピー"><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></div></td>
        <CopyableCell label="URL" onCopy={onCopy} value={password.url}>{password.url ? <a href={password.url} rel="noopener noreferrer" target="_blank">{truncateText(password.url, 32)}</a> : ''}</CopyableCell>
        <td className="memo-cell"><span className="ellipsis-text memo-ellipsis">{truncateText(password.memo || '', 256)}</span></td>
        <td className="actions"><IonButton aria-label="詳細表示" className="detail-button" fill="clear" onClick={() => onOpenDetail(password)} size="small" title="詳細表示">詳細</IonButton><button className="btn-edit" onClick={() => onEdit(password)} title="編集" type="button">✎</button><button className="btn-delete" onClick={() => onDelete(password.id)} title="削除" type="button">🗑️</button></td>
      </tr>;
    })}</tbody>
  </table></div>
);

export default PasswordTable;
