import { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonIcon, IonLabel, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import { lockClosedOutline, searchOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import ProductLinks from '../components/ProductLinks';
import './MainHome.css';

interface MainHomeProps {
  onOpenPasswordManager: () => void;
}

type InstallPlatform = 'iphone' | 'android' | 'windows';

const getDefaultInstallPlatform = (): InstallPlatform => {
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) return 'android';
  if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'iphone';
  return 'windows';
};

const MainHome: React.FC<MainHomeProps> = ({ onOpenPasswordManager }) => {
  const [installPlatform, setInstallPlatform] = useState<InstallPlatform>(getDefaultInstallPlatform);

  return <IonPage>
    <IonHeader><IonToolbar><IonTitle>AcIMS</IonTitle></IonToolbar></IonHeader>
    <IonContent>
      <main className="main-home">
        <section className="main-home-intro">
          <h1>アカウント情報を、ひとつにまとめて管理</h1>
          <p>サービスごとのログイン情報、URL、メモを安全に整理し、必要なときにすぐ取り出せます。</p>
        </section>
        <section className="main-home-features" aria-label="主な機能">
          <div className="main-home-feature"><IonIcon icon={lockClosedOutline} /><div><h2>まとめて保管</h2><p>アカウント情報をカテゴリごとに管理できます。</p></div></div>
          <div className="main-home-feature"><IonIcon icon={searchOutline} /><div><h2>すばやく検索</h2><p>キーワードやカテゴリから必要な情報を絞り込めます。</p></div></div>
          <div className="main-home-feature"><IonIcon icon={shieldCheckmarkOutline} /><div><h2>マスターパスワードで保護</h2><p>管理画面を開く前に認証を行います。</p></div></div>
        </section>
        <section className="main-home-actions">
          <IonButton color="primary" expand="block" onClick={onOpenPasswordManager}>パスワード管理を開く</IonButton>
        </section>
        <section className="install-guide" aria-labelledby="install-guide-title">
          <h2 id="install-guide-title">アプリとして使う</h2>
          <p>よく使う端末に登録すると、次回からすぐに開けます。</p>
          <IonSegment aria-label="端末を選択" className="install-platform-selector" value={installPlatform} onIonChange={(event) => setInstallPlatform(event.detail.value as InstallPlatform)}>
            <IonSegmentButton value="iphone"><IonLabel>iPhone</IonLabel></IonSegmentButton>
            <IonSegmentButton value="android"><IonLabel>Android</IonLabel></IonSegmentButton>
            <IonSegmentButton value="windows"><IonLabel>Windows</IonLabel></IonSegmentButton>
          </IonSegment>
          {installPlatform === 'iphone' ? <div className="install-steps">
            <p><strong>Safari</strong> でこのページを開いてください。Chrome などではなく Safari を使うと確実です。</p>
            <ol>
              <li>現在の画面より下部の <strong>共有</strong> ボタン（□から↑のアイコン）をタップします。</li>
              <li>メニューを下へスクロールして <strong>「ホーム画面に追加」</strong> をタップします。</li>
              <li>名前が「AcIMS」になっていることを確認し、右上の <strong>「追加」</strong> をタップします。</li>
              <li>ホーム画面に追加された AcIMS アイコンから次回以降起動します。</li>
            </ol>
            <a href="https://support.apple.com/ja-jp/guide/iphone/iph42ab2f3a7/ios" rel="noreferrer" target="_blank">Apple の公式手順を開く</a>
          </div> : installPlatform === 'android' ? <div className="install-steps">
            <p><strong>Chrome</strong> でこのページを開いてください。</p>
            <ol>
              <li>現在の画面より右上の <strong>︙</strong>（メニュー）をタップします。</li>
              <li><strong>「ホーム画面に追加」</strong> または <strong>「アプリをインストール」</strong> をタップします。</li>
              <li>確認画面で <strong>「インストール」</strong> または <strong>「追加」</strong> をタップします。</li>
              <li>ホーム画面またはアプリ一覧に追加された AcIMS アイコンから次回以降起動します。</li>
            </ol>
            <a href="https://support.google.com/chrome/answer/9658361?hl=ja" rel="noreferrer" target="_blank">Google の公式手順を開く</a>
          </div> : <div className="install-steps">
            <p>ブラウザのお気に入り、またはデスクトップのショートカットに登録できます。</p>
            <h3>お気に入りに登録する</h3>
            <ol>
              <li>このページを開いた状態で、キーボードの <strong>Ctrl + D</strong> を押します。</li>
              <li>保存先を選び、<strong>「完了」</strong> をクリックします。</li>
              <li>次回からブラウザのお気に入り一覧から AcIMS を開けます。</li>
            </ol>
            <h3>デスクトップにショートカットを作成する</h3>
            <ol>
              <li>Chrome または Edge でこのページを開きます。</li>
              <li>右上の <strong>︙</strong> メニューから、Chrome は <strong>「キャスト、保存、共有」→「ショートカットを作成」</strong>、Edge は <strong>「アプリ」→「このサイトをアプリとしてインストール」</strong> を選びます。</li>
              <li>表示される確認画面で作成またはインストールを完了します。</li>
              <li>デスクトップまたはスタートメニューに追加された AcIMS から起動します。</li>
            </ol>
            <p className="install-note">ブラウザの安全設定により、このサイトから自動でデスクトップへショートカットを作成することはできません。</p>
          </div>}
        </section>
        <ProductLinks />
      </main>
    </IonContent>
  </IonPage>;
};

export default MainHome;
