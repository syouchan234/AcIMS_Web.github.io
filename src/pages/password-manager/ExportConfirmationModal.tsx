import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';

interface ExportConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// 平文ファイルの注意事項はダウンロード直前に必ず表示する。
const ExportConfirmationModal: React.FC<ExportConfirmationModalProps> = ({ isOpen, onConfirm, onClose }) => (
  <IonModal className="export-confirmation-modal" isOpen={isOpen} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>エクスポートの確認</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="settings-container export-confirmation-content">
      <h2>データの取り扱いに注意してください</h2>
      <p>エクスポートファイルには登録パスワードが平文で含まれます。安全な場所に保管し、不要になったら削除してください。</p>
      <p>データはこの端末のブラウザ内に保存されます。同じ端末・同じブラウザ・同じブラウザプロファイルで利用してください。端末やブラウザを変更する場合は、エクスポートしたファイルを変更先でインポートしてください。</p>
      <div className="export-confirmation-actions"><IonButton expand="block" onClick={onConfirm}>エクスポートする</IonButton><IonButton expand="block" fill="outline" onClick={onClose}>キャンセル</IonButton></div>
    </div></IonContent>
  </IonModal>
);

export default ExportConfirmationModal;
