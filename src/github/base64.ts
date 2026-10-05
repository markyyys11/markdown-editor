/**
 * UTF-8 aware base64 codec.
 *
 * The GitHub Contents API transports file bodies as base64. Hermes has neither
 * `TextEncoder` nor a UTF-8 aware `btoa`, and `atob` throws on anything outside
 * latin1 — which would corrupt every Russian document in this app. The
 * conversion therefore lives here, where it is also directly testable.
 */
/* eslint-disable no-bitwise -- base64 is bit manipulation; the masks and shifts are the algorithm. */

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE64_VALUES = (() => {
  const values = new Int16Array(128).fill(-1);
  for (let index = 0; index < BASE64_ALPHABET.length; index += 1) {
    values[BASE64_ALPHABET.charCodeAt(index)] = index;
  }
  // GitHub emits the standard alphabet; accept the URL-safe one as well.
  values['-'.charCodeAt(0)] = 62;
  values['_'.charCodeAt(0)] = 63;
  return values;
})();

function utf8ToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    let codePoint = text.charCodeAt(index);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < text.length) {
      const low = text.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (low - 0xdc00);
        index += 1;
      }
    }
    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      // A lone surrogate also lands here; it encodes to an invalid sequence
      // that the decoder below turns back into the same surrogate.
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return bytes;
}

function utf8FromBytes(bytes: number[]): string {
  let text = '';
  let index = 0;
  while (index < bytes.length) {
    const first = bytes[index];
    if (first < 0x80) {
      text += String.fromCharCode(first);
      index += 1;
      continue;
    }

    let codePoint: number;
    let continuations: number;
    if ((first & 0xe0) === 0xc0) {
      codePoint = first & 0x1f;
      continuations = 1;
    } else if ((first & 0xf0) === 0xe0) {
      codePoint = first & 0x0f;
      continuations = 2;
    } else if ((first & 0xf8) === 0xf0) {
      codePoint = first & 0x07;
      continuations = 3;
    } else {
      text += '\uFFFD';
      index += 1;
      continue;
    }

    if (index + continuations >= bytes.length) {
      text += '\uFFFD';
      break;
    }

    let complete = true;
    for (let offset = 1; offset <= continuations; offset += 1) {
      const next = bytes[index + offset];
      if ((next & 0xc0) !== 0x80) {
        complete = false;
        break;
      }
      codePoint = (codePoint << 6) | (next & 0x3f);
    }
    if (!complete) {
      text += '\uFFFD';
      index += 1;
      continue;
    }

    if (continuations === 3) {
      const adjusted = codePoint - 0x10000;
      text += String.fromCharCode(
        0xd800 + (adjusted >> 10),
        0xdc00 + (adjusted & 0x3ff),
      );
    } else {
      text += String.fromCharCode(codePoint);
    }
    index += continuations + 1;
  }
  return text;
}

function encodeBase64(bytes: number[]): string {
  let encoded = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = index + 1 < bytes.length ? bytes[index + 1] : -1;
    const third = index + 2 < bytes.length ? bytes[index + 2] : -1;
    encoded += BASE64_ALPHABET[first >> 2];
    encoded +=
      BASE64_ALPHABET[((first & 0x03) << 4) | (second >= 0 ? second >> 4 : 0)];
    encoded +=
      second >= 0
        ? BASE64_ALPHABET[((second & 0x0f) << 2) | (third >= 0 ? third >> 6 : 0)]
        : '=';
    encoded += third >= 0 ? BASE64_ALPHABET[third & 0x3f] : '=';
  }
  return encoded;
}

function decodeBase64(encoded: string): number[] {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let index = 0; index < encoded.length; index += 1) {
    const charCode = encoded.charCodeAt(index);
    // GitHub wraps its base64 payloads across lines.
    if (
      charCode === 0x0a ||
      charCode === 0x0d ||
      charCode === 0x20 ||
      charCode === 0x09
    ) {
      continue;
    }
    if (charCode === 0x3d /* '=' */) {
      break;
    }
    const value = charCode < 128 ? BASE64_VALUES[charCode] : -1;
    if (value < 0) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

/** Encodes text to standard base64, UTF-8 aware. */
export function utf8ToBase64(text: string): string {
  return encodeBase64(utf8ToBytes(text));
}

/** Decodes standard base64 to text, UTF-8 aware. */
export function base64ToUtf8(encoded: string): string {
  return utf8FromBytes(decodeBase64(encoded));
}
