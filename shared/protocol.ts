/**
 * The message contract between the React Native host and the CodeMirror bundle
 * that runs inside the WebView.
 *
 * This module is deliberately free of runtime dependencies so that both sides
 * can import it: the host uses the types plus `parseWebviewMessage`, while the
 * WebView bundle imports the types only and therefore pulls in no extra code.
 */

/** Editing shows the Markdown source; preview renders it like GitHub does. */
export type DocumentMode = 'edit' | 'preview';

/** Messages sent from React Native into the WebView. */
export type HostMessage =
  | {type: 'setMode'; mode: DocumentMode}
  | {type: 'setDocument'; content: string};

/** Messages sent from the WebView back to React Native. */
export type WebviewMessage =
  | {type: 'ready'}
  | {type: 'change'; content: string}
  | {type: 'openLink'; href: string}
  | {type: 'error'; message: string};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Validates an untrusted payload coming out of the WebView. Anything that does
 * not match the contract is dropped rather than crashing the host.
 */
export function parseWebviewMessage(raw: unknown): WebviewMessage | null {
  if (!isRecord(raw)) {
    return null;
  }
  const {type} = raw;
  if (typeof type !== 'string') {
    return null;
  }
  switch (type) {
    case 'ready':
      return {type: 'ready'};
    case 'change':
      return typeof raw.content === 'string'
        ? {type: 'change', content: raw.content}
        : null;
    case 'openLink':
      return typeof raw.href === 'string'
        ? {type: 'openLink', href: raw.href}
        : null;
    case 'error':
      return typeof raw.message === 'string'
        ? {type: 'error', message: raw.message}
        : null;
    default:
      return null;
  }
}
