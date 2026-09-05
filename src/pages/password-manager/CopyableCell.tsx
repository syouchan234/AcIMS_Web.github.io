import { IonButton, IonIcon } from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import type { ReactNode } from 'react';
import { truncateText } from './passwordManagerUtils';

interface CopyableCellProps {
  value: string;
  label: string;
  children?: ReactNode;
  onCopy: (value: string, label: string) => void;
}

// 一覧の各セルで使うコピー操作を共通化する。
const CopyableCell: React.FC<CopyableCellProps> = ({ value, label, children, onCopy }) => (
  <td><div className="copyable-cell">
    <span className="copyable-cell-value ellipsis-text">{children ?? truncateText(value, 32)}</span>
    <IonButton aria-label={`${label}をコピー`} className="copy-button" disabled={!value} fill="clear" onClick={() => onCopy(value, label)} size="small" title={`${label}をコピー`}>
      <IonIcon icon={copyOutline} slot="icon-only" />
    </IonButton>
  </div></td>
);

export default CopyableCell;
