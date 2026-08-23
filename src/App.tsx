import React from 'react';
import {
  IonApp,
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  setupIonicReact,
} from '@ionic/react';
import MainHome from './pages/MainHome';
import PasswordManager from './pages/PasswordManager';
import { useAppController } from './hooks/useAppController';
import './App.css';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';

import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const {
    showSetup,
    showHome,
    showPasswordAuth,
    showPasswordManager,
    masterPassword,
    confirmPassword,
    authPassword,
    setupError,
    authError,
    isBiometricAvailable,
    encryptionKey,
    setMasterPassword,
    setConfirmPassword,
    setAuthPassword,
    goToHome,
    goToPasswordManager,
    handleSetup,
    handleAuth,
    handleWebAuthnAuth,
    handleClearAllData,
    autoLockSettings,
    updateAutoLockSettings,
    autoAuthEnabled,
    updateAutoAuthEnabled,
    changeMasterPassword,
  } = useAppController();

  return (
    <IonApp>
      {showSetup && (
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>マスターパスワード設定</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="auth-form">
              <h2>初回設定</h2>
              <p>マスターパスワードを設定してアプリを開始します。</p>

              <IonItem>
                <IonLabel position="stacked">マスターパスワード</IonLabel>
                <IonInput
                  type="password"
                  value={masterPassword}
                  onIonInput={(e) => setMasterPassword(e.detail.value ?? '')}
                  placeholder="4文字以上"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">確認用パスワード</IonLabel>
                <IonInput
                  type="password"
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value ?? '')}
                  placeholder="もう一度入力"
                />
              </IonItem>

              {setupError && <p className="auth-error">{setupError}</p>}

              <IonButton expand="block" onClick={handleSetup} className="auth-primary-action">
                設定して開始
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      )}

      {showHome && (
        <MainHome
          onOpenPasswordManager={goToPasswordManager}
        />
      )}

      {showPasswordAuth && (
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>マスターパスワード認証</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="auth-form">
              <h2>マスターパスワードを入力</h2>
              <p>パスワード管理画面を開くにはマスターパスワードが必要です。</p>

              <IonItem>
                <IonLabel position="stacked">パスワード</IonLabel>
                <IonInput
                  type="password"
                  value={authPassword}
                  onIonInput={(e) => setAuthPassword(e.detail.value ?? '')}
                  placeholder="マスターパスワード"
                />
              </IonItem>

              <IonItem className="auth-auto-auth-toggle">
                <IonCheckbox checked={autoAuthEnabled} onIonChange={(e) => updateAutoAuthEnabled(e.detail.checked)}>
                  端末認証を自動実行する
                </IonCheckbox>
              </IonItem>

              {authError && <p className="auth-error">{authError}</p>}

              <IonButton expand="block" onClick={handleAuth} className="auth-primary-action">
                認証して開く
              </IonButton>
              {isBiometricAvailable && (
                <IonButton expand="block" fill="outline" onClick={() => void handleWebAuthnAuth()} className="auth-biometric-action">
                  端末認証で開く
                </IonButton>
              )}
              <IonButton expand="block" fill="clear" onClick={goToHome} className="auth-secondary-action">
                ホームに戻る
              </IonButton>
              <IonButton
                color="danger"
                expand="block"
                fill="outline"
                onClick={() => {
                  if (window.confirm('登録したパスワードとマスターパスワードをすべて削除します。よろしいですか？')) {
                    void handleClearAllData();
                  }
                }}
                className="auth-initialize-action"
              >
                初期化
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      )}

      {showPasswordManager && (
        <PasswordManager
          encryptionKey={encryptionKey}
          autoLockSettings={autoLockSettings}
          onAutoLockSettingsChange={updateAutoLockSettings}
          onBack={goToHome}
          onMasterPasswordChange={changeMasterPassword}
        />
      )}
    </IonApp>
  );
};

export default App;
