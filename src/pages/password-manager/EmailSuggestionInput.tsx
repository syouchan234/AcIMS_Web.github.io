import { useMemo, useState } from 'react';
import { IonInput } from '@ionic/react';

interface EmailSuggestionInputProps {
  value: string;
  registeredEmails: string[];
  onChange: (value: string) => void;
}

const emailDomains = ['gmail.com', 'outlook.jp', 'outlook.com', 'yahoo.co.jp', 'icloud.com'];

// 登録済みアドレスと、入力済みローカル部に対応するドメイン候補を表示する。
const EmailSuggestionInput: React.FC<EmailSuggestionInputProps> = ({ value, registeredEmails, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  const suggestions = useMemo(() => {
    const normalizedValue = value.toLocaleLowerCase();
    const registeredSuggestions = registeredEmails.filter((email) => email.toLocaleLowerCase().includes(normalizedValue));
    const atIndex = value.indexOf('@');
    const domainSuggestions = atIndex > 0
      ? emailDomains
        .filter((domain) => `${value.slice(0, atIndex)}@${domain}`.toLocaleLowerCase().startsWith(normalizedValue))
        .map((domain) => `${value.slice(0, atIndex)}@${domain}`)
      : [];
    return [...new Set([...registeredSuggestions, ...domainSuggestions])].slice(0, 8);
  }, [registeredEmails, value]);

  return <div className="email-suggestion-field">
    <IonInput
      value={value}
      onIonFocus={() => setIsFocused(true)}
      onIonBlur={() => setTimeout(() => setIsFocused(false), 150)}
      onIonInput={(event) => onChange(event.detail.value || '')}
      placeholder="メールアドレス"
      type="email"
    />
    {isFocused && suggestions.length > 0 && <div className="email-suggestions" role="listbox" aria-label="メールアドレス候補">
      {suggestions.map((suggestion) => <button key={suggestion} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(suggestion); setIsFocused(false); }}>{suggestion}</button>)}
    </div>}
  </div>;
};

export default EmailSuggestionInput;
