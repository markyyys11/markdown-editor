import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {GitHubClient, GitHubError} from '../github/client';
import type {GitHubUser} from '../github/types';
import {clearToken, loadToken, saveToken} from '../storage/tokenStore';

type AuthState =
  | {status: 'loading'}
  | {status: 'signedOut'}
  | {status: 'signedIn'; token: string; user: GitHubUser | null; client: GitHubClient};

type AuthContextValue = {
  status: AuthState['status'];
  token: string | null;
  user: GitHubUser | null;
  client: GitHubClient | null;
  signIn(token: string): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the GitHub session: the stored token and the client built from it.
 *
 * A stored token is verified once at startup. A failure to *reach* GitHub is
 * not a failure to authenticate, so the session survives being offline; only a
 * rejected token signs the user out.
 */
export function AuthProvider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<AuthState>({status: 'loading'});

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const stored = await loadToken();
      if (cancelled) {
        return;
      }
      if (stored === null) {
        setState({status: 'signedOut'});
        return;
      }
      const client = new GitHubClient(stored);
      try {
        const user = await client.getUser();
        if (!cancelled) {
          setState({status: 'signedIn', token: stored, user, client});
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof GitHubError && error.kind === 'auth') {
          await clearToken();
          if (!cancelled) {
            setState({status: 'signedOut'});
          }
          return;
        }
        setState({status: 'signedIn', token: stored, user: null, client});
      }
    };

    restore().catch(() => {
      // Reading the keystore failed, so there is no session to restore. The
      // only recovery is to ask for the token again.
      if (!cancelled) {
        setState({status: 'signedOut'});
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (token: string) => {
    const trimmed = token.trim();
    const client = new GitHubClient(trimmed);
    // Validating before persisting keeps a rejected token out of the keystore.
    const user = await client.getUser();
    await saveToken(trimmed);
    setState({status: 'signedIn', token: trimmed, user, client});
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setState({status: 'signedOut'});
  }, []);

  // The state is a discriminated union internally, but screens get a flat
  // object: only the tree below `status === 'signedIn'` may rely on `client`,
  // and `useGitHub()` is what enforces that at compile time.
  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      token: state.status === 'signedIn' ? state.token : null,
      user: state.status === 'signedIn' ? state.user : null,
      client: state.status === 'signedIn' ? state.client : null,
      signIn,
      signOut,
    }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return value;
}

/** The client for the current session; only valid on signed-in screens. */
export function useGitHub(): GitHubClient {
  const {client} = useAuth();
  if (client === null) {
    throw new Error('useGitHub() requires a signed-in session');
  }
  return client;
}
