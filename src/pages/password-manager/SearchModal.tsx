import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';

interface SearchModalProps {
  isOpen: boolean;
  searchQuery: string;
  categoryFilter: string;
  categories: string[];
  onSearchQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
}

// 検索条件の編集だけを担当し、一覧の絞り込みは親の状態で行う。
const SearchModal: React.FC<SearchModalProps> = ({ isOpen, searchQuery, categoryFilter, categories, onSearchQueryChange, onCategoryChange, onClear, onClose }) => (
  <IonModal className="search-modal" isOpen={isOpen} onDidDismiss={onClose}>
    <IonHeader><IonToolbar><IonTitle>検索</IonTitle><IonButtons slot="end"><IonButton onClick={onClose}>閉じる</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><div className="search-modal-content"><IonSearchbar onIonInput={(event) => onSearchQueryChange(event.detail.value ?? '')} placeholder="フリーワード検索" value={searchQuery} /><div className="category-filter search-modal-filter"><IonSelect aria-label="カテゴリで絞り込み" interface="popover" onIonChange={(event) => onCategoryChange(event.detail.value)} placeholder="すべてのカテゴリ" value={categoryFilter}><IonSelectOption value="">すべてのカテゴリ</IonSelectOption>{categories.map((category) => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}</IonSelect></div><IonButton expand="block" fill="outline" onClick={onClear}>条件をクリア</IonButton></div></IonContent>
  </IonModal>
);

export default SearchModal;
