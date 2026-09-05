import type { PasswordEntry } from '../../services/passwordDb';

// パスワード生成に関する設定と処理を UI から分離する。
export interface GeneratorSettings {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export const defaultGeneratorSettings: GeneratorSettings = {
  length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false,
};
export const MIN_GENERATED_PASSWORD_LENGTH = 1;
export const MAX_GENERATED_PASSWORD_LENGTH = 256;

const characterSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};

const randomIndex = (length: number) => {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);
  return randomValue[0] % length;
};

export const generatePassword = (settings: GeneratorSettings) => {
  const enabledSets = [
    settings.uppercase && characterSets.uppercase,
    settings.lowercase && characterSets.lowercase,
    settings.numbers && characterSets.numbers,
    settings.symbols && characterSets.symbols,
  ].filter((characters): characters is string => Boolean(characters)).map((characters) => (
    settings.excludeAmbiguous ? characters.replace(/[O0Il1]/g, '') : characters
  ));
  const length = Math.min(MAX_GENERATED_PASSWORD_LENGTH, Math.max(MIN_GENERATED_PASSWORD_LENGTH, settings.length));
  if (enabledSets.length === 0) return '';

  const allCharacters = enabledSets.join('');
  const requiredCharacterSets = [...enabledSets];
  for (let index = requiredCharacterSets.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [requiredCharacterSets[index], requiredCharacterSets[swapIndex]] = [requiredCharacterSets[swapIndex], requiredCharacterSets[index]];
  }

  // まず有効な文字種を 1 文字ずつ含め、その後に残りを埋める。
  const password = requiredCharacterSets.slice(0, length).map((characters) => characters[randomIndex(characters.length)]);
  while (password.length < length) password.push(allCharacters[randomIndex(allCharacters.length)]);
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }
  return password.join('');
};

export interface DesktopPasswordEntry {
  InformationId: string;
  Category: string;
  AppSiteName: string;
  UserId: string;
  Email: string;
  Password: string;
  Url: string;
  Memo: string;
}

export const isImportEntry = (entry: unknown): entry is DesktopPasswordEntry => {
  if (!entry || typeof entry !== 'object') return false;
  return ['InformationId', 'Category', 'AppSiteName', 'UserId', 'Email', 'Password', 'Url', 'Memo']
    .every((key) => typeof (entry as Record<string, unknown>)[key] === 'string');
};

export const toPasswordEntry = (entry: DesktopPasswordEntry): Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  category: entry.Category, appName: entry.AppSiteName, userId: entry.UserId, email: entry.Email,
  password: entry.Password, url: entry.Url, memo: entry.Memo,
});

export const getPasswordMask = (password: string) => Array.from(password, () => '•').join('');
export const truncateText = (value: string, maxLength: number) => {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 1))}...` : value;
};
