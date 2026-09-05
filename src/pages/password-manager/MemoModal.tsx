import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';

interface MemoModalProps {
  memo: string | null;
  onClose: () => void;
}

const MemoModal: React.FC<MemoModalProps> = ({ memo, onClose }) => (
  <IonModal isOpen={memo !== null} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>備考</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="memo-detail">{memo}</div></IonContent>
  </IonModal>
);

export default MemoModal;
