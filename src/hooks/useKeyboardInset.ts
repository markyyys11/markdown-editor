import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

type KeyboardInset = {
  /** Padding the layout needs so that its bottom edge sits above the keyboard. */
  inset: number;
  visible: boolean;
  /** Attach to the outermost view of the screen, so its height can be watched. */
  onLayout(event: LayoutChangeEvent): void;
};

/**
 * Keeps a bottom bar above the soft keyboard, whatever the platform does.
 *
 * Android either shrinks the window when the keyboard appears or leaves it
 * alone, and which of the two happens depends on the OS version — Android 15
 * deprecated `adjustResize` for apps that target API 35+. Padding blindly would
 * therefore double-count on one Android and under-count on another.
 *
 * Two facts make it exact:
 *
 * 1. RN reports the keyboard height as `imeInsets.bottom - systemBarInsets.bottom`
 *    (`ReactRootView.checkForKeyboardEvents`), because in the classic world the
 *    window's bottom edge already sits above the navigation bar. In a layout that
 *    extends to the screen edge — this app is edge to edge — the navigation-bar
 *    height has to be added back.
 * 2. Whether the window shrank is measured from this layout's own height rather
 *    than from `Dimensions`, because only the view is guaranteed to change size.
 *
 * The remainder after subtracting (2) from (1) is what still has to be padded.
 */
export function useKeyboardInset(navBarHeight: number): KeyboardInset {
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const tallest = useRef(0);
  const navBar = useRef(navBarHeight);
  const visible = keyboardHeight > 0;

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible && navBarHeight > 0) {
      // While the keyboard is up this inset may be reported as zero, so the last
      // value seen without one is the value to keep.
      navBar.current = navBarHeight;
    }
  }, [visible, navBarHeight]);

  const onLayout = (event: LayoutChangeEvent): void => {
    const { height } = event.nativeEvent.layout;
    if (height > tallest.current) {
      // The tallest height seen is the layout without a keyboard, which is the
      // baseline the shrink is measured against.
      tallest.current = height;
    }
    setLayoutHeight(height);
  };

  const shrink = Math.max(0, tallest.current - layoutHeight);

  return {
    inset: Math.max(0, keyboardHeight + navBar.current - shrink),
    visible,
    onLayout,
  };
}
