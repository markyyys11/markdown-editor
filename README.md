[English](README.md) | [Русский](README.ru.md)

# Markdown Editor

An Android app for editing Markdown documents that live in GitHub repositories: open a
file, edit its source with syntax highlighting or read it rendered, and commit the change
straight from the phone.

<a href="https://boosty.to/mrk_sn/posts/634e5095-2509-45a6-ae5e-190b22807878?share=success_publish_link">
  <img src="https://cdn.simpleicons.org/boosty" alt="Boosty" width="16" height="16">
  Support
</a>

## Features

- **Two modes.** **Edit** shows the whole Markdown source with its formatting highlighted;
  **Preview** renders the document: headings, tables, task lists, strikethrough, quotes and
  fenced code blocks with syntax highlighting.
- **Repositories.** Sign-in with a personal access token, a paginated repository list,
  directory navigation, branch switching, a "Markdown only" filter and creating a new `.md`
  file.
- **Committing.** A dialog for the commit message; a divergence from GitHub ("the file
  changed") is recognised separately and offers to reload the document.
- **Working links.** In the preview, relative `.md` files open in the editor and the rest
  open in the browser.
- **Themes.** 65 VS Code themes with runtime switching; the same palette covers the editor,
  the preview and the app's chrome.

## Stack

| Layer | Technology |
| --- | --- |
| App | React Native 0.84.1 (Hermes, New Architecture), TypeScript |
| Editor | CodeMirror 6 in a WebView |
| Preview | markdown-it, highlight.js, DOMPurify |
| WebView bundle | esbuild |
| Token storage | react-native-keychain (Android Keystore) |
| GitHub data | Contents API |
| Themes | VS Code themes mapped onto the app's theme model |

## Requirements

| Component | Version |
| --- | --- |
| Node | ≥ 22.11 |
| JDK | 17 |
| Android SDK | platform 36, build-tools 36.0.0 |
| minSdk / targetSdk | 24 / 36 |

## Getting started

```shell
npm install
npm start          # Metro, in a separate terminal
npm run android    # build and install on a device or emulator
```

## GitHub token

The app needs a personal access token (PAT):

- a classic token needs the `repo` scope;
- a fine-grained token needs the `Contents: Read and write` permission.

The token is validated with a `GET /user` request before it is stored, and it is kept in the
Android Keystore through `react-native-keychain`.

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Metro |
| `npm run android` | build and install on Android |
| `npm run build:webview` | rebuild the WebView bundle from `webview-src/` |
| `npm run themes` | regenerate the themes from the installed VS Code extension |
| `npm test` | Jest |
| `npm run typecheck` | `tsc` for the app and separately for `webview-src` |
| `npm run lint` | ESLint |

## Project structure

```
shared/          message-protocol types and the palette, shared by both worlds
webview-src/     CodeMirror 6 and the preview renderer, bundled by esbuild
scripts/         builds the WebView bundle and generates the themes
src/
  github/        the Contents API client, base64, paths, link parsing
  storage/       token storage (Android — Keystore)
  state/         the GitHub session (AuthProvider)
  navigation/    the screen stack and the unsaved-changes guard
  components/    interface elements
  screens/       token → repositories → directory → editor
  webview/       the HTML shell and the WebView host
  themes/        VS Code theme mapping and the theme provider
```

Changes under `webview-src/` need `npm run build:webview`: the generated bundle
(`src/webview/bundle.generated.ts`) is committed and is what the app actually loads.

## Limitations

- **Android only.** The `ios/` project has been removed, and Windows is not a target.
- **Online only.** Everything goes through the GitHub Contents API, so branches cannot be
  merged and files larger than 1 MB are unavailable.
