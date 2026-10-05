import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.markdowneditor.github-token';
const ACCOUNT = 'github';

/**
 * Android storage for the GitHub personal access token.
 *
 * `react-native-keychain` keeps it in Android's `SharedPreferences` encrypted
 * with a key held by the Android Keystore, so the token is not readable from a
 * backup or from another app.
 */
export async function saveToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(ACCOUNT, token, { service: SERVICE });
}

export async function loadToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  return credentials === false ? null : credentials.password;
}

export async function clearToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
