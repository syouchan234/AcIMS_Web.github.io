import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { IonButton, IonButtons, IonContent, IonFabButton, IonHeader, IonIcon, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToast, IonToolbar } from '@ionic/react';
import { addOutline, chevronUpOutline, searchOutline, settingsOutline } from 'ionicons/icons';
import type { PasswordEntry } from '../../services/passwordDb';
import type { PasswordManagerViewProps } from './types';
import '../PasswordManager.css';
import PasswordCards from './PasswordCards';
import DetailModal from './DetailModal';
import ExportConfirmationModal from './ExportConfirmationModal';
import MemoModal from './MemoModal';
import PasswordFormModal from './PasswordFormModal';
import PasswordGeneratorModal from './PasswordGeneratorModal';
import PasswordTable from './PasswordTable';
import SearchModal from './SearchModal';
import SettingsModal from './SettingsModal';
import { defaultGeneratorSettings, generatePassword, isImportEntry, toPasswordEntry, type DesktopPasswordEntry, type GeneratorSettings } from './passwordManagerUtils';

const PasswordManagerView: React.FC<PasswordManagerViewProps> = ({
  onBack, passwords, loading, isModalOpen, editingId, formData, onOpenModal, onCloseModal,
  onSave, onDelete, onFormDataChange, onImport, autoLockSettings, onAutoLockSettingsChange, onMasterPasswordChange,
  isBiometricSupported, onBiometricSetup, onOpenTerms,
}) => {
  // 画面状態: 一覧、検索、表示切替、各モーダルの開閉状態をここで管理する。
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<number>>(new Set());
  const [memoDetail, setMemoDetail] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>(defaultGeneratorSettings);
  const [isFormPasswordVisible, setIsFormPasswordVisible] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [detailPassword, setDetailPassword] = useState<PasswordEntry | null>(null);
  const [isDetailPasswordVisible, setIsDetailPasswordVisible] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentMasterPassword, setCurrentMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [masterPasswordConfirmation, setMasterPasswordConfirmation] = useState('');
  const [autoLockDraft, setAutoLockDraft] = useState(autoLockSettings);
  const importInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLIonContentElement | null>(null);

  // 表示用の派生データ: 入力値からカテゴリと絞り込み結果を計算する。
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const categories = useMemo(() => [...new Set(passwords.map((password) => password.category))].sort(), [passwords]);
  const filteredPasswords = useMemo(() => passwords.filter((password) => {
    if (categoryFilter && password.category !== categoryFilter) return false;
    if (!normalizedQuery) return true;
    return [password.category, password.appName, password.userId, password.email, password.password, password.url, password.memo]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  }), [categoryFilter, normalizedQuery, passwords]);
  const allPasswordsVisible = passwords.length > 0 && passwords.every((password) => password.id !== undefined && visiblePasswordIds.has(password.id));

  // イベント処理: 子コンポーネントから受けた操作をデータ操作や状態変更へつなぐ。
  const copyText = async (value: string) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try { await navigator.clipboard.writeText(value); return; } catch { /* 下のフォールバックへ進む。 */ }
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
    try { await copyText(value); setToastMessage(`${label}をコピーしました`); }
    catch (error) { console.error('クリップボードへのコピーに失敗しました:', error); setToastMessage('コピーに失敗しました'); }
  };
  const togglePasswordVisibility = (id: number | undefined) => {
    if (id === undefined) return;
    setVisiblePasswordIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleAllPasswordsVisibility = () => setVisiblePasswordIds(allPasswordsVisible ? new Set() : new Set(passwords.flatMap((password) => password.id === undefined ? [] : [password.id])));
  const openGenerator = () => { setGeneratedPassword(generatePassword(generatorSettings)); setIsGeneratorOpen(true); };
  const exportPasswords = () => {
    const exportData: DesktopPasswordEntry[] = passwords.map(({ id, category, appName, userId, email, password, url, memo }) => ({ InformationId: id === undefined ? '' : String(id), Category: category, AppSiteName: appName, UserId: userId, Email: email, Password: password, Url: url, Memo: memo }));
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
      await onImport(data.map(toPasswordEntry));
      setToastMessage('データをインポートしました');
    } catch (error) { console.error('インポートエラー:', error); setToastMessage('インポートファイルを読み込めませんでした'); }
  };
  const saveAppSettings = () => { onAutoLockSettingsChange(autoLockDraft); setToastMessage('自動ロック設定を保存しました'); };
  const changeMasterPassword = async () => {
    const error = await onMasterPasswordChange(currentMasterPassword, newMasterPassword, masterPasswordConfirmation);
    if (error) { setToastMessage(error); return; }
    setCurrentMasterPassword(''); setNewMasterPassword(''); setMasterPasswordConfirmation(''); setToastMessage('マスターパスワードを変更しました');
  };
  const closeDetail = () => { setDetailPassword(null); setIsDetailPasswordVisible(false); };
  const editDetail = () => { if (!detailPassword) return; const password = detailPassword; closeDetail(); onOpenModal(password); };
  const deleteDetail = () => { if (!detailPassword) return; onDelete(detailPassword.id); closeDetail(); };
  const handleQuickScrollTop = () => { contentRef.current?.scrollToTop?.(500); };

  // 画面構成: 個別の表示責務は子コンポーネントへ委譲する。
  return <IonPage className="password-manager-page">
    <IonHeader><IonToolbar><IonButtons slot="start">{onBack && <IonButton onClick={onBack}>戻る</IonButton>}</IonButtons><IonTitle>パスワード管理</IonTitle><IonButtons slot="end"><IonButton aria-label="設定" onClick={() => { setAutoLockDraft(autoLockSettings); setIsAppSettingsOpen(true); }} title="設定"><IonIcon icon={settingsOutline} slot="icon-only" /></IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent className="password-manager-content" ref={contentRef} scrollEvents onIonScroll={(event) => setShowQuickActions((event.detail?.scrollTop ?? 0) > 120)}>
      <div className="header-section"><IonSearchbar onIonInput={(event) => setSearchQuery(event.detail.value ?? '')} placeholder="パスワードを検索" value={searchQuery} /><div className="category-filter"><IonSelect aria-label="カテゴリで絞り込み" interface="popover" onIonChange={(event) => setCategoryFilter(event.detail.value)} placeholder="すべてのカテゴリ" value={categoryFilter}><IonSelectOption value="">すべてのカテゴリ</IonSelectOption>{categories.map((category) => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}</IonSelect></div></div>
      {loading ? <div className="loading">読み込み中...</div> : passwords.length === 0 ? <div className="empty-state"><p>パスワードが登録されていません</p></div> : filteredPasswords.length === 0 ? <div className="empty-state"><p>検索条件に一致するパスワードはありません</p></div> : <><PasswordTable passwords={filteredPasswords} visiblePasswordIds={visiblePasswordIds} allPasswordsVisible={allPasswordsVisible} onTogglePasswordVisibility={togglePasswordVisibility} onToggleAllPasswordsVisibility={toggleAllPasswordsVisibility} onCopy={handleCopy} onOpenDetail={setDetailPassword} onEdit={onOpenModal} onDelete={onDelete} /><PasswordCards passwords={filteredPasswords} visiblePasswordIds={visiblePasswordIds} onTogglePasswordVisibility={togglePasswordVisibility} onCopy={handleCopy} onOpenDetail={setDetailPassword} onEdit={onOpenModal} onDelete={onDelete} /></>}
      <div className={`quick-action-stack ${showQuickActions ? 'visible' : ''}`}><button aria-label="上へ戻る" className="quick-action-button" onClick={handleQuickScrollTop} type="button"><IonIcon icon={chevronUpOutline} /></button><button aria-label="検索" className="quick-action-button" onClick={() => setIsSearchModalOpen(true)} type="button"><IonIcon icon={searchOutline} /></button><IonFabButton aria-label="新規追加" className="quick-fab-action" onClick={() => onOpenModal()}><IonIcon icon={addOutline} /></IonFabButton></div>
    </IonContent>
    <PasswordFormModal isOpen={isModalOpen} editingId={editingId} formData={formData} categories={categories} isPasswordVisible={isFormPasswordVisible} onFormDataChange={onFormDataChange} onTogglePasswordVisibility={() => setIsFormPasswordVisible((visible) => !visible)} onOpenGenerator={openGenerator} onSave={onSave} onClose={() => { setIsFormPasswordVisible(false); onCloseModal(); }} />
    <PasswordGeneratorModal isOpen={isGeneratorOpen} generatedPassword={generatedPassword} settings={generatorSettings} onSettingsChange={setGeneratorSettings} onRegenerate={() => setGeneratedPassword(generatePassword(generatorSettings))} onCopy={() => handleCopy(generatedPassword, '生成したパスワード')} onUse={() => { onFormDataChange({ ...formData, password: generatedPassword }); setIsGeneratorOpen(false); }} onClose={() => setIsGeneratorOpen(false)} />
    <SettingsModal isOpen={isAppSettingsOpen} autoLockDraft={autoLockDraft} isBiometricSupported={isBiometricSupported} currentMasterPassword={currentMasterPassword} newMasterPassword={newMasterPassword} masterPasswordConfirmation={masterPasswordConfirmation} onAutoLockDraftChange={setAutoLockDraft} onCurrentMasterPasswordChange={setCurrentMasterPassword} onNewMasterPasswordChange={setNewMasterPassword} onMasterPasswordConfirmationChange={setMasterPasswordConfirmation} onExport={() => { setIsAppSettingsOpen(false); setIsExportConfirmOpen(true); }} onImport={() => importInputRef.current?.click()} onSaveAutoLock={saveAppSettings} onChangeMasterPassword={changeMasterPassword} onBiometricSetup={() => void onBiometricSetup()} onOpenTerms={() => { setIsAppSettingsOpen(false); onOpenTerms?.(); }} onClose={() => setIsAppSettingsOpen(false)} />
    <input accept="application/json" className="import-input" onChange={importPasswords} ref={importInputRef} type="file" />
    <ExportConfirmationModal isOpen={isExportConfirmOpen} onConfirm={() => { setIsExportConfirmOpen(false); exportPasswords(); }} onClose={() => setIsExportConfirmOpen(false)} />
    <SearchModal isOpen={isSearchModalOpen} searchQuery={searchQuery} categoryFilter={categoryFilter} categories={categories} onSearchQueryChange={setSearchQuery} onCategoryChange={setCategoryFilter} onClear={() => { setSearchQuery(''); setCategoryFilter(''); }} onClose={() => setIsSearchModalOpen(false)} />
    <DetailModal password={detailPassword} isPasswordVisible={isDetailPasswordVisible} onTogglePasswordVisibility={() => setIsDetailPasswordVisible((visible) => !visible)} onCopy={handleCopy} onEdit={editDetail} onDelete={deleteDetail} onClose={closeDetail} />
    <MemoModal memo={memoDetail} onClose={() => setMemoDetail(null)} />
    <IonToast duration={2000} isOpen={Boolean(toastMessage)} message={toastMessage} onDidDismiss={() => setToastMessage('')} />
  </IonPage>;
};

export default PasswordManagerView;
