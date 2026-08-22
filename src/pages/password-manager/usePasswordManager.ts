import { useCallback, useEffect, useState } from 'react';
import { passwordDb, type PasswordEntry } from '../../services/passwordDb';
import type { PasswordFormData } from './types';

const emptyFormData = (): PasswordFormData => ({ category: '', appName: '', userId: '', email: '', password: '', url: '', memo: '' });

export const usePasswordManager = () => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PasswordFormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const loadPasswords = useCallback(async () => {
    try { setLoading(true); setPasswords(await passwordDb.getAllPasswords()); }
    catch (error) { console.error('パスワード読み込みエラー:', error); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadPasswords(); }, [loadPasswords]);
  const handleOpenModal = (password?: PasswordEntry) => {
    setEditingId(password?.id ?? null);
    setFormData(password ? { category: password.category, appName: password.appName, userId: password.userId, email: password.email, password: password.password, url: password.url, memo: password.memo } : emptyFormData());
    setIsModalOpen(true);
  };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };
  const handleSave = async () => {
    try {
      if (!formData.category || !formData.appName) { alert('カテゴリとアプリサイト名は必須です'); return; }
      if (editingId !== null) await passwordDb.updatePassword(editingId, formData);
      else await passwordDb.addPassword(formData);
      await loadPasswords(); handleCloseModal();
    } catch (error) { console.error('保存エラー:', error); alert('保存に失敗しました'); }
  };
  const handleDelete = async (id: number | undefined) => {
    if (!id || !window.confirm('このパスワードを削除しますか？')) return;
    try { await passwordDb.deletePassword(id); await loadPasswords(); }
    catch (error) { console.error('削除エラー:', error); alert('削除に失敗しました'); }
  };
  const handleImport = async (entries: PasswordEntry[]) => {
    await passwordDb.replaceAllPasswords(entries.map(({ category, appName, userId, email, password, url, memo }) => ({ category, appName, userId, email, password, url, memo })));
    await loadPasswords();
  };
  return { passwords, loading, isModalOpen, editingId, formData, setFormData, handleOpenModal, handleCloseModal, handleSave, handleDelete, handleImport };
};
