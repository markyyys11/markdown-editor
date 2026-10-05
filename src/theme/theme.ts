export {monoFontStack, palette} from '../../shared/palette';

export const spacing = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24} as const;

export const radius = {sm: 6, md: 8, lg: 12} as const;

/**
 * Type scale for the app chrome. Deliberately small and flat: the Markdown
 * itself gets its typography from the editor and the preview, so the shell must
 * not compete with it.
 */
export const fontSize = {
  caption: 12,
  label: 13,
  body: 15,
  title: 17,
  hero: 22,
} as const;

/** Height of the tappable rows and buttons, sized for a thumb. */
export const controlHeight = 44;
