import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { lockClosedOutline, searchOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import './MainHome.css';

interface MainHomeProps {
  onOpenPasswordManager: () => void;
}

const MainHome: React.FC<MainHomeProps> = ({ onOpenPasswordManager }) => {
  return <IonPage>
    <IonHeader><IonToolbar><IonTitle>アカウント情報の一括管理</IonTitle></IonToolbar></IonHeader>
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
      </main>
    </IonContent>
  </IonPage>;
};

export default MainHome;
