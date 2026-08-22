import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput,
  IonItem, IonLabel, IonModal, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTextarea,
  IonTitle, IonToast, IonToggle, IonToolbar,
} from '@ionic/react';
import { addOutline, copyOutline, eyeOffOutline, eyeOutline, settingsOutline } from 'ionicons/icons';
import type { PasswordEntry } from '../../services/passwordDb';
import type { PasswordManagerViewProps } from './types';
import '../PasswordManager.css';

interface GeneratorSettings {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const defaultGeneratorSettings: GeneratorSettings = {
  length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false,
};
const characterSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};

const randomIndex = (length: number) => {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);
  return randomValue[0] % length;
};

const generatePassword = (settings: GeneratorSettings) => {
  const enabledSets = [
    settings.uppercase && characterSets.uppercase,
    settings.lowercase && characterSets.lowercase,
    settings.numbers && characterSets.numbers,
    settings.symbols && characterSets.symbols,
  ].filter((characters): characters is string => Boolean(characters)).map((characters) => (
    settings.excludeAmbiguous ? characters.replace(/[O0Il1]/g, '') : characters
  ));
  const length = Math.max(settings.length, enabledSets.length);

  if (enabledSets.length === 0) return '';

  const allCharacters = enabledSets.join('');
  const password = enabledSets.map((characters) => characters[randomIndex(characters.length)]);
  while (password.length < length) password.push(allCharacters[randomIndex(allCharacters.length)]);

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }
  return password.join('');
};

const isImportEntry = (entry: unknown): entry is PasswordEntry => {
  if (!entry || typeof entry !== 'object') return false;
  return ['category', 'appName', 'userId', 'email', 'password', 'url', 'memo']
    .every((key) => typeof (entry as Record<string, unknown>)[key] === 'string');
};

const getPasswordMask = (password: string) => Array.from(password, () => '•').join('');

interface CopyableCellProps {
  value: string;
  label: string;
  children?: ReactNode;
  onCopy: (value: string, label: string) => void;
}

const CopyableCell: React.FC<CopyableCellProps> = ({ value, label, children, onCopy }) => (
  <td><div className="copyable-cell">
    <span className="copyable-cell-value">{children ?? value}</span>
    <IonButton aria-label={`${label}をコピー`} className="copy-button" disabled={!value} fill="clear" onClick={() => onCopy(value, label)} size="small" title={`${label}をコピー`}>
      <IonIcon icon={copyOutline} slot="icon-only" />
    </IonButton>
  </div></td>
);

const PasswordManagerView: React.FC<PasswordManagerViewProps> = ({
  onBack, passwords, loading, isModalOpen, editingId, formData, onOpenModal, onCloseModal,
  onSave, onDelete, onFormDataChange, onImport, autoLockSettings, onAutoLockSettingsChange, onMasterPasswordChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<number>>(new Set());
  const [memoDetail, setMemoDetail] = useState<PasswordEntry | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>(defaultGeneratorSettings);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [currentMasterPassword, setCurrentMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [masterPasswordConfirmation, setMasterPasswordConfirmation] = useState('');
  const [autoLockDraft, setAutoLockDraft] = useState(autoLockSettings);
  const importInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const categories = useMemo(() => [...new Set(passwords.map((password) => password.category))].sort(), [passwords]);
  const filteredPasswords = useMemo(() => passwords.filter((password) => {
    if (categoryFilter && password.category !== categoryFilter) return false;
    if (!normalizedQuery) return true;
    return [password.category, password.appName, password.userId, password.email, password.password, password.url, password.memo]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  }), [categoryFilter, normalizedQuery, passwords]);
  const allPasswordsVisible = passwords.length > 0 && passwords.every((password) => password.id !== undefined && visiblePasswordIds.has(password.id));

  const updateFormData = (field: keyof typeof formData, value: string) => onFormDataChange({ ...formData, [field]: value });
  const copyText = async (value: string) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
      }
    }

    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (!copied) throw new Error('copy failed');
  };
  const handleCopy = async (value: string, label: string) => {
    try {
      await copyText(value);
      setToastMessage(`${label}をコピーしました`);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      setToastMessage('コピーに失敗しました');
    }
  };
  const togglePasswordVisibility = (id: number | undefined) => {
    if (id === undefined) return;
    setVisiblePasswordIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllPasswordsVisibility = () => {
    setVisiblePasswordIds(allPasswordsVisible ? new Set() : new Set(passwords.flatMap((password) => password.id === undefined ? [] : [password.id])));
  };
  const openGenerator = () => {
    setGeneratedPassword(generatePassword(generatorSettings));
    setIsGeneratorOpen(true);
  };
  const exportPasswords = () => {
    const exportData = passwords.map(({ category, appName, userId, email, password, url, memo }) => ({ category, appName, userId, email, password, url, memo }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `acims-passwords-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url);
  };
  const importPasswords = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!Array.isArray(data) || !data.every(isImportEntry)) throw new Error('invalid');
      if (!window.confirm('現在の登録パスワードを置き換えてインポートします。よろしいですか？')) return;
      await onImport(data as PasswordEntry[]);
      setToastMessage('データをインポートしました');
    } catch (error) {
      console.error('インポートエラー:', error);
      setToastMessage('インポートファイルを読み込めませんでした');
    }
  };
  const saveAppSettings = () => {
    onAutoLockSettingsChange(autoLockDraft);
    setToastMessage('自動ロック設定を保存しました');
  };
  const changeMasterPassword = () => {
    const error = onMasterPasswordChange(currentMasterPassword, newMasterPassword, masterPasswordConfirmation);
    if (error) { setToastMessage(error); return; }
    setCurrentMasterPassword(''); setNewMasterPassword(''); setMasterPasswordConfirmation('');
    setToastMessage('マスターパスワードを変更しました');
  };

  const renderPasswordRow = (password: PasswordEntry) => {
    const isMasked = !(password.id !== undefined && visiblePasswordIds.has(password.id));
    return <tr key={password.id}>
      <CopyableCell label="カテゴリ" onCopy={handleCopy} value={password.category} />
      <CopyableCell label="アプリサイト名" onCopy={handleCopy} value={password.appName} />
      <CopyableCell label="ID" onCopy={handleCopy} value={password.userId} />
      <CopyableCell label="メールアドレス" onCopy={handleCopy} value={password.email} />
      <td className="password-cell"><div className="copyable-cell">
        <span className="copyable-cell-value">{isMasked ? <span className="masked-password">{getPasswordMask(password.password)}</span> : password.password}</span>
        <IonButton aria-label={isMasked ? 'パスワードのマスクを解除' : 'パスワードをマスク'} aria-pressed={!isMasked} className="copy-button" fill="clear" onClick={() => togglePasswordVisibility(password.id)} size="small" title={isMasked ? 'マスク解除' : 'マスク'}><IonIcon icon={isMasked ? eyeOutline : eyeOffOutline} slot="icon-only" /></IonButton>
        <IonButton aria-label="パスワードをコピー" className="copy-button" disabled={!password.password} fill="clear" onClick={() => handleCopy(password.password, 'パスワード')} size="small" title="パスワードをコピー"><IonIcon icon={copyOutline} slot="icon-only" /></IonButton>
      </div></td>
      <CopyableCell label="URL" onCopy={handleCopy} value={password.url}>{password.url && <a href={password.url} rel="noopener noreferrer" target="_blank">{password.url}</a>}</CopyableCell>
      <td><IonButton aria-label="備考を詳細表示" className="detail-button" disabled={!password.memo} fill="clear" onClick={() => setMemoDetail(password)} size="small" title="詳細表示">詳細</IonButton><IonButton aria-label="備考をコピー" className="copy-button" disabled={!password.memo} fill="clear" onClick={() => handleCopy(password.memo, '備考')} size="small" title="備考をコピー"><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></td>
      <td className="actions"><button className="btn-edit" onClick={() => onOpenModal(password)} title="編集" type="button">✎</button><button className="btn-delete" onClick={() => onDelete(password.id)} title="削除" type="button">🗑️</button></td>
    </tr>;
  };

  const renderPasswordCard = (password: PasswordEntry) => {
    const isMasked = !(password.id !== undefined && visiblePasswordIds.has(password.id));
    const renderCardField = (label: string, value: string, content?: ReactNode) => <li><strong>{label}</strong><span className="password-card-value">{content ?? (value || '未登録')}</span><IonButton aria-label={`${label}をコピー`} disabled={!value} fill="clear" onClick={() => handleCopy(value, label)} size="small" title={`${label}をコピー`}><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></li>;
    return <article className="password-card" key={password.id}>
      <div className="password-card-header"><h2>{password.appName || '名称未設定'}</h2></div>
      <ul className="password-card-fields">
        {renderCardField('カテゴリ', password.category)}
        {renderCardField('ID', password.userId)}
        {renderCardField('メールアドレス', password.email)}
        <li className="password-card-password"><strong>パスワード</strong><span className="password-card-value">{isMasked ? <span className="masked-password">{getPasswordMask(password.password)}</span> : password.password}</span><IonButton aria-label={isMasked ? 'パスワードのマスクを解除' : 'パスワードをマスク'} aria-pressed={!isMasked} fill="clear" onClick={() => togglePasswordVisibility(password.id)} size="small" title={isMasked ? 'マスク解除' : 'マスク'}><IonIcon icon={isMasked ? eyeOutline : eyeOffOutline} slot="icon-only" /></IonButton><IonButton aria-label="パスワードをコピー" disabled={!password.password} fill="clear" onClick={() => handleCopy(password.password, 'パスワード')} size="small" title="パスワードをコピー"><IonIcon icon={copyOutline} slot="icon-only" /></IonButton></li>
        {renderCardField('URL', password.url, password.url ? <a href={password.url} rel="noopener noreferrer" target="_blank">{password.url}</a> : undefined)}
        {renderCardField('備考', password.memo)}
      </ul>
      <div className="password-card-actions"><IonButton fill="clear" onClick={() => onOpenModal(password)}>編集</IonButton><IonButton color="danger" fill="clear" onClick={() => onDelete(password.id)}>削除</IonButton></div>
    </article>;
  };

  return <IonPage>
    <IonHeader><IonToolbar>
      <IonButtons slot="start">{onBack && <IonButton onClick={onBack}>戻る</IonButton>}</IonButtons>
      <IonTitle>パスワード管理</IonTitle>
      <IonButtons slot="end"><IonButton aria-label="設定" onClick={() => { setAutoLockDraft(autoLockSettings); setIsAppSettingsOpen(true); }} title="設定"><IonIcon icon={settingsOutline} slot="icon-only" /></IonButton></IonButtons>
    </IonToolbar></IonHeader>
    <IonContent className="password-manager-content">
      <div className="header-section">
        <IonSearchbar onIonInput={(event) => setSearchQuery(event.detail.value ?? '')} placeholder="パスワードを検索" value={searchQuery} />
        <div className="category-filter">
          <IonSelect aria-label="カテゴリで絞り込み" interface="popover" onIonChange={(event) => setCategoryFilter(event.detail.value)} placeholder="すべてのカテゴリ" value={categoryFilter}>
            <IonSelectOption value="">すべてのカテゴリ</IonSelectOption>
            {categories.map((category) => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}
          </IonSelect>
        </div>
      </div>
      {loading ? <div className="loading">読み込み中...</div>
        : passwords.length === 0 ? <div className="empty-state"><p>パスワードが登録されていません</p></div>
          : filteredPasswords.length === 0 ? <div className="empty-state"><p>検索条件に一致するパスワードはありません</p></div>
            : <><div className="passwords-table"><table>
              <thead><tr><th>カテゴリ</th><th>アプリサイト名</th><th>ID</th><th>メールアドレス</th><th>パスワード <IonButton aria-label={allPasswordsVisible ? 'すべてのパスワードをマスク' : 'すべてのパスワードのマスクを解除'} className="toggle-all-button" fill="clear" onClick={toggleAllPasswordsVisibility} size="small">{allPasswordsVisible ? 'すべて隠す' : 'すべて表示'}</IonButton></th><th>URL</th><th>備考</th><th>操作</th></tr></thead>
              <tbody>{filteredPasswords.map(renderPasswordRow)}</tbody>
            </table></div><div className="password-cards">{filteredPasswords.map(renderPasswordCard)}</div></>}
      <IonFab className="add-password-fab" horizontal="end" slot="fixed" vertical="bottom"><IonFabButton aria-label="新規追加" onClick={() => onOpenModal()}><IonIcon icon={addOutline} /></IonFabButton></IonFab>
    </IonContent>
    <IonModal isOpen={isModalOpen} onDidDismiss={onCloseModal}>
      <IonHeader><IonToolbar><IonTitle>{editingId !== null ? 'パスワード編集' : 'パスワード新規追加'}</IonTitle><IonButtons slot="end"><IonButton onClick={onCloseModal}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
      <IonContent><div className="form-container">
        <IonItem><IonLabel position="stacked">カテゴリ *</IonLabel><IonInput value={formData.category} onIonChange={(event) => updateFormData('category', event.detail.value || '')} placeholder="例: メール、SNS、銀行" /></IonItem>
        {categories.length > 0 && <IonItem><IonLabel>登録済みカテゴリから選択</IonLabel><IonSelect aria-label="登録済みカテゴリから選択" interface="popover" onIonChange={(event) => updateFormData('category', event.detail.value)} placeholder="カテゴリを選択"><IonSelectOption value="">選択しない</IonSelectOption>{categories.map((category) => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}</IonSelect></IonItem>}
        <IonItem><IonLabel position="stacked">アプリサイト名 *</IonLabel><IonInput value={formData.appName} onIonChange={(event) => updateFormData('appName', event.detail.value || '')} placeholder="例: Gmail、Twitter" /></IonItem>
        <IonItem><IonLabel position="stacked">ID</IonLabel><IonInput value={formData.userId} onIonChange={(event) => updateFormData('userId', event.detail.value || '')} placeholder="ユーザーID" /></IonItem>
        <IonItem><IonLabel position="stacked">メールアドレス</IonLabel><IonInput value={formData.email} onIonChange={(event) => updateFormData('email', event.detail.value || '')} placeholder="メールアドレス" type="email" /></IonItem>
        <IonItem><IonLabel position="stacked">パスワード</IonLabel><IonInput value={formData.password} onIonChange={(event) => updateFormData('password', event.detail.value || '')} placeholder="パスワード" type="password" /></IonItem>
        {editingId === null && <IonButton className="generate-password-button" fill="outline" onClick={openGenerator}><IonIcon icon={addOutline} slot="start" />パスワードを生成</IonButton>}
        <IonItem><IonLabel position="stacked">URL</IonLabel><IonInput value={formData.url} onIonChange={(event) => updateFormData('url', event.detail.value || '')} placeholder="https://example.com" type="url" /></IonItem>
        <IonItem><IonLabel position="stacked">備考</IonLabel><IonTextarea autoGrow value={formData.memo} onIonChange={(event) => updateFormData('memo', event.detail.value || '')} placeholder="メモ" /></IonItem>
        <div className="form-actions"><IonButton color="primary" expand="block" onClick={onSave}>保存</IonButton><IonButton color="secondary" expand="block" onClick={onCloseModal}>キャンセル</IonButton></div>
      </div></IonContent>
    </IonModal>
    <IonModal isOpen={isGeneratorOpen} onDidDismiss={() => setIsGeneratorOpen(false)}>
      <IonHeader><IonToolbar><IonTitle>パスワード生成</IonTitle><IonButtons slot="end"><IonButton onClick={() => setIsGeneratorOpen(false)}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
      <IonContent><div className="generator-container"><p className="generated-password">{generatedPassword}</p><IonButton expand="block" fill="outline" onClick={() => setGeneratedPassword(generatePassword(generatorSettings))}>再生成</IonButton><IonButton expand="block" fill="outline" onClick={() => handleCopy(generatedPassword, '生成したパスワード')}>コピー</IonButton><IonButton expand="block" onClick={() => { updateFormData('password', generatedPassword); setIsGeneratorOpen(false); }}>このパスワードを使用</IonButton>
        <div className="generator-settings"><h2>生成設定</h2><IonItem><IonLabel>文字数（4〜64）</IonLabel><IonInput inputMode="numeric" max="64" min="4" onIonInput={(event) => setGeneratorSettings({ ...generatorSettings, length: Math.min(64, Math.max(4, Number(event.detail.value) || 4)) })} type="number" value={generatorSettings.length} /></IonItem><IonItem><IonLabel>英大文字</IonLabel><IonToggle checked={generatorSettings.uppercase} onIonChange={(event) => setGeneratorSettings({ ...generatorSettings, uppercase: event.detail.checked })} /></IonItem><IonItem><IonLabel>英小文字</IonLabel><IonToggle checked={generatorSettings.lowercase} onIonChange={(event) => setGeneratorSettings({ ...generatorSettings, lowercase: event.detail.checked })} /></IonItem><IonItem><IonLabel>数字</IonLabel><IonToggle checked={generatorSettings.numbers} onIonChange={(event) => setGeneratorSettings({ ...generatorSettings, numbers: event.detail.checked })} /></IonItem><IonItem><IonLabel>記号</IonLabel><IonToggle checked={generatorSettings.symbols} onIonChange={(event) => setGeneratorSettings({ ...generatorSettings, symbols: event.detail.checked })} /></IonItem><IonItem><IonLabel>紛らわしい文字を除外</IonLabel><IonToggle checked={generatorSettings.excludeAmbiguous} onIonChange={(event) => setGeneratorSettings({ ...generatorSettings, excludeAmbiguous: event.detail.checked })} /></IonItem></div>
      </div></IonContent>
    </IonModal>
    <IonModal isOpen={isAppSettingsOpen} onDidDismiss={() => setIsAppSettingsOpen(false)}>
      <IonHeader><IonToolbar><IonTitle>設定</IonTitle><IonButtons slot="end"><IonButton onClick={() => setIsAppSettingsOpen(false)}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
      <IonContent><div className="settings-container">
        <h2>データ</h2><p>エクスポートしたファイルには登録パスワードが平文で含まれます。安全な場所に保管してください。</p><IonButton expand="block" fill="outline" onClick={exportPasswords}>データをエクスポート</IonButton><input accept="application/json" className="import-input" onChange={importPasswords} ref={importInputRef} type="file" /><IonButton expand="block" fill="outline" onClick={() => importInputRef.current?.click()}>データをインポート</IonButton>
        <h2>マスターパスワードの変更</h2><IonItem><IonLabel position="stacked">現在のパスワード</IonLabel><IonInput onIonInput={(event) => setCurrentMasterPassword(event.detail.value ?? '')} type="password" value={currentMasterPassword} /></IonItem><IonItem><IonLabel position="stacked">新しいパスワード</IonLabel><IonInput onIonInput={(event) => setNewMasterPassword(event.detail.value ?? '')} type="password" value={newMasterPassword} /></IonItem><IonItem><IonLabel position="stacked">新しいパスワード（確認）</IonLabel><IonInput onIonInput={(event) => setMasterPasswordConfirmation(event.detail.value ?? '')} type="password" value={masterPasswordConfirmation} /></IonItem><IonButton expand="block" fill="outline" onClick={changeMasterPassword}>マスターパスワードを変更</IonButton>
        <div className="auto-lock-section"><h2>自動ロック</h2><IonItem className="auto-lock-toggle-item"><IonLabel>自動ロックを有効にする</IonLabel><IonToggle checked={autoLockDraft.enabled} onIonChange={(event) => setAutoLockDraft({ ...autoLockDraft, enabled: event.detail.checked })} /></IonItem><IonItem className="auto-lock-duration-item" disabled={!autoLockDraft.enabled}><IonLabel>ロックまでの時間（分）</IonLabel><IonInput inputMode="numeric" max="60" min="1" onIonInput={(event) => setAutoLockDraft({ ...autoLockDraft, minutes: Number(event.detail.value) || 1 })} type="number" value={autoLockDraft.minutes} /></IonItem><IonButton expand="block" onClick={saveAppSettings}>自動ロック設定を保存</IonButton></div>
      </div></IonContent>
    </IonModal>
    <IonModal isOpen={memoDetail !== null} onDidDismiss={() => setMemoDetail(null)}>
      <IonHeader><IonToolbar><IonTitle>備考</IonTitle><IonButtons slot="end"><IonButton onClick={() => setMemoDetail(null)}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
      <IonContent><div className="memo-detail">{memoDetail?.memo}</div></IonContent>
    </IonModal>
    <IonToast duration={2000} isOpen={Boolean(toastMessage)} message={toastMessage} onDidDismiss={() => setToastMessage('')} />
  </IonPage>;
};

export default PasswordManagerView;
