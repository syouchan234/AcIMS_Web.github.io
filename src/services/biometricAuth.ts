const WEBAUTHN_CREDENTIAL_KEY = 'acims_webauthn_credential';
const RP_NAME = 'AcIMSWeb';
const USER_NAME = 'acims-user';

const toBase64Url = (value: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(value)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const createChallenge = () => crypto.getRandomValues(new Uint8Array(32));

/** 生体認証の対象をスマートフォン・タブレットのブラウザーに限定する。 */
export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const { userAgent, maxTouchPoints } = navigator;
  return /Android|iPhone|iPod|IEMobile|Opera Mini/i.test(userAgent)
    || (/iPad|Macintosh/i.test(userAgent) && maxTouchPoints > 1);
};

export const isBiometricAuthenticationSupported = () => typeof window !== 'undefined'
  && isMobileDevice()
  && Boolean(window.PublicKeyCredential)
  && Boolean(navigator.credentials);

export const hasBiometricCredential = () => Boolean(localStorage.getItem(WEBAUTHN_CREDENTIAL_KEY));

export const clearBiometricCredential = () => {
  localStorage.removeItem(WEBAUTHN_CREDENTIAL_KEY);
};

export const isBiometricAuthenticationAvailable = async () => {
  if (!isBiometricAuthenticationSupported() || !hasBiometricCredential()) return false;

  const checkAvailability = window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
  if (!checkAvailability) return true;

  try {
    return await checkAvailability.call(window.PublicKeyCredential);
  } catch {
    return false;
  }
};

/** プラットフォームパスキーを登録する。端末の案内を中止しても既存の設定は維持する。 */
export const registerBiometricCredential = async (replaceExisting = false) => {
  if (!isBiometricAuthenticationSupported()) return false;
  if (!replaceExisting && hasBiometricCredential()) return true;

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: createChallenge(),
        rp: { name: RP_NAME },
        user: { id: createChallenge(), name: USER_NAME, displayName: 'AcIMSWeb ユーザー' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
        attestation: 'none',
      },
    });

    if (!(credential instanceof PublicKeyCredential)) return false;
    localStorage.setItem(WEBAUTHN_CREDENTIAL_KEY, toBase64Url(credential.rawId));
    return true;
  } catch {
    return false;
  }
};

/** 端末の生体認証画面を表示し、認証の成否を返す。 */
export const authenticateWithBiometrics = async () => {
  if (!isBiometricAuthenticationSupported()) return false;
  const credentialId = localStorage.getItem(WEBAUTHN_CREDENTIAL_KEY);
  if (!credentialId) return false;

  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: createChallenge(),
        allowCredentials: [{ id: fromBase64Url(credentialId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return true;
  } catch {
    return false;
  }
};
