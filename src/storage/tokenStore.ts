/**
 * Fallback token store, used on any platform that is not Android — which in
 * practice means the Jest environment, since Android is the platform this app
 * ships for and it resolves `tokenStore.android.ts` instead.
 *
 * The token is deliberately kept in memory only: writing a credential to plain
 * storage would be worse than asking for it again on the next launch. A real
 * implementation for another platform must use that platform's secure store.
 */
let token: string | null = null;

export async function saveToken(next: string): Promise<void> {
  token = next;
}

export async function loadToken(): Promise<string | null> {
  return token;
}

export async function clearToken(): Promise<void> {
  token = null;
}
