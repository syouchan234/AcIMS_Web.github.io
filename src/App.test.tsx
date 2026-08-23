import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('shows the account management introduction on first launch', () => {
    render(<App />);

    expect(screen.getByText('アカウント情報を、ひとつにまとめて管理')).toBeInTheDocument();
    expect(screen.getByText('パスワード管理を開く')).toBeInTheDocument();
  });

  test('shows setup screen when password manager is opened for the first time', () => {
    render(<App />);
    fireEvent.click(screen.getByText('パスワード管理を開く'));

    expect(screen.getByText('初回設定')).toBeInTheDocument();
    expect(screen.getByText('設定して開始')).toBeInTheDocument();
  });

  test('requires password before opening password manager', () => {
    window.localStorage.setItem('acims_master_password', 'secret123');
    render(<App />);

    expect(screen.getByText('マスターパスワードを入力')).toBeInTheDocument();
    expect(screen.getByText('認証して開く')).toBeInTheDocument();
  });
});
