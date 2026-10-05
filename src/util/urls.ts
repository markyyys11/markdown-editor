import {Linking} from 'react-native';

/**
 * Hands a URL to the system.
 *
 * `Linking.openURL` rejects when no installed app can handle the scheme, and
 * link targets come from repository content, so a rejection is expected rather
 * than exceptional. There is nothing actionable to show for it.
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    // No app claims this URL; nothing useful to report.
  }
}
