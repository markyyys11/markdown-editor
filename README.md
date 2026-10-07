[English](README.md) | [Русский](README.ru.md)

# Markdown Editor

A Markdown editor for documents in GitHub repositories, on Android: edit the source with
syntax highlighting and commit straight from the phone.

<a href="https://boosty.to/mrk_sn/posts/634e5095-2509-45a6-ae5e-190b22807878?share=success_publish_link">
  <img src="https://cdn.simpleicons.org/boosty" alt="Boosty" width="16" height="16">
  Support
</a>

## What it does

- **Two modes.**
  **Edit** («Правка») shows the whole Markdown source — every special character (`#`, `**`,
  `>`, backticks, `-`, `|`) is visible, and the formatting is highlighted in different
  colours. The font size does not change: only colour, weight and underlining do.
  **Preview** («Просмотр») renders the document: headings, tables, task
  lists, strikethrough, quotes and fenced code blocks with highlighting.
- **Working with repositories.** Sign-in with a personal token, a paginated repository list,
  directory navigation, branch switching, a "Markdown only" («только Markdown») filter, and
  creating a new `.md` file.
- **Committing.** A dialog for the commit message; a divergence from GitHub ("the file
  changed" — «файл изменился») is recognised separately and offers to reload the document.
- **Links in the preview** work: relative `.md` files open in the editor, the rest go to the
  browser.
- **Dark theme** in the GitHub Dark palette — one palette for the editor, the preview and
  the app's chrome.

## Requirements

| Component | Version |
| --- | --- |
| Node | ≥ 22.11 |
| JDK | 17+ |
| Android SDK | platform 36, build-tools 36.0.0 |
| React Native | 0.84.1 |

## Running

```shell
npm install
npm start          # Metro, in a separate terminal
npm run android    # build and install on a device or emulator
```

## GitHub token

The app needs a personal access token (PAT):

- a classic token needs the `repo` scope;
- a fine-grained token needs the `Contents: Read and write` permission.

The token is validated with a `GET /user` request before it is stored, so a rejected token
never reaches storage, and it lives in the Android Keystore through `react-native-keychain`.

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Metro |
| `npm run android` | build and install on Android |
| `npm run build:webview` | rebuild the editor bundle from `webview-src/` |
| `npm test` | Jest |
| `npm run typecheck` | `tsc` for the app and separately for `webview-src` |
| `npm run lint` | ESLint |

## How it is put together

```
shared/          message-protocol types and the palette — shared by both worlds
webview-src/     CodeMirror 6 and the preview renderer; bundled by esbuild
scripts/         builds the WebView bundle into a string constant
src/
  github/        the Contents API client, base64, paths, link parsing
  storage/       token storage (Android — Keystore)
  state/         the GitHub session (AuthProvider)
  navigation/    the screen stack and the unsaved-changes guard
  components/    interface elements
  screens/       token → repositories → directory → editor
  webview/       the HTML shell and the WebView host
  theme/         design tokens
```

### Why a WebView

The editor is CodeMirror 6, the same class of editor that underpins VS Code. It cannot be
built directly into React Native, so `webview-src/` is bundled by esbuild into a single line
of JavaScript (`src/webview/bundle.generated.ts`, a generated and committed file), and the
host inlines it into the HTML. No manual build step is needed: `npm start` works right away,
and `npm run build:webview` is only required after changes under `webview-src/`.

The host and the page talk in messages (`shared/protocol.ts`): the host sends `setTheme`,
`setMode`, `setDocument` and `insert`, and the page answers `ready`, `change`, `openLink` and
`error`. The document is passed as a **prop**, not through an imperative call: the value is
already there at mount time, so it cannot be lost. Only commands that answer a gesture —
inserting a symbol — are sent imperatively, and that is safe because by the time a key is
tapped the page is mounted for sure.

The theme arrives first: the page keeps its panes hidden until it does, so the editor never
gets a chance to paint in a palette that belongs to no theme. And the shell's background is
transparent — behind it is the React Native container, already painted in the active theme,
so with a light theme there is no dark flash when a file opens.

Before `ready`, exactly one thing is worth remembering — the current text: the reference to
it is updated both while typing and when the page reloads, and `ready` sends it again. That
is also what restores the content if Android reclaims the WebView's renderer.

### Preview

The preview has styles of its own rather than a package's: the colours come from the same
keys VS Code uses to draw its own Markdown preview (`textLink`, `textBlockQuote`,
`textCodeBlock`, `textPreformat`), so the preview follows the theme the way VS Code itself
does. The markup is produced by `markdown-it` (tables, strikethrough, task lists,
autolinks), code blocks by `highlight.js` with colours from the theme's `tokenColors`, and
any raw HTML in the document goes through `DOMPurify`: the user opens other people's
repositories, and without sanitising, a document could reach the bridge into React Native.

Package styles would not have fitted here: `github-markdown-css` hard-codes its colours as
literals, so overriding them would have to be done selector by selector, and everything not
overridden would stay in someone else's palette — which is exactly what shows up on a light
theme.

### Where the themes come from

`npm run themes` reads the installed extension
(`%USERPROFILE%\.vscode\extensions\beardedbear.beardedtheme-*`), runs every theme through
the rules in `src/themes/mapVscodeTheme.ts` and writes the result to
`src/themes/generated/themes.ts`. The file is committed, so building the app needs neither
VS Code nor the extension on the machine.

The highlighting comes from the theme's **real `tokenColors`**, not from a guess: for each
Markdown role a selector is looked up that is a prefix of the token's scope at a dot
boundary, and the longest one wins — the TextMate rule. Matching by substring is wrong, and
dangerously so because it is invisible: the selector
`punctuation.definition.list.begin.python` would start answering a question about a Markdown
list.

The editor font is **Cascadia Mono** (SIL OFL, the direct successor to Consolas, which this
VS Code effectively runs on). It is variable, so a single 625 KB file provides every weight,
and its Cyrillic coverage was verified before it was embedded: Consolas and Segoe UI cannot
be copied into the APK — they are proprietary Microsoft fonts.

### Why the Contents API and not real git

`isomorphic-git` needs an fs adapter with `lstat`, `readlink`, `symlink` and `chmod`, none of
which `react-native-fs` has, on Android or on Windows. The Contents API makes the "opened a
file — changed it — committed it" flow work identically and without shims. The price: online
only, branches cannot be merged, and files larger than 1 MB are unavailable (the app says so
in a message of its own).

## What is verified and what is not

**Verified:** `tsc` for the app and for `webview-src`, 126 Jest tests (the base64 codec with
Cyrillic, paths, link parsing, the protocol, the classification of GitHub errors, escaping of
the HTML shell, rendering of the preview, the symbol-insertion rules, and the theme mapping:
the TextMate rule, fallback colours, and the completeness and contrast of all 65 themes),
ESLint with no findings, and bundling through Metro.

Also verified against **live data**, not just fixtures: `readFile` was compared byte for byte
with real files from GitHub (including a 41 KB README with 90 non-ASCII characters), and the
markup-role colours against what the installed theme's own parse independently reports.

**Not verified:** the `gradlew` build and running on a device — the system had no JDK and no
Android SDK. Nothing that is only visible on a device (the gesture keypad, the behaviour of
the WebView bridge, the font size) had been run at the time of writing.

## Known limitations and deliberate decisions

- **Size.** The editor bundle is ~1.67 MB of minified JS; it sits in the app bundle as a
  string (~3.9 MB) and is parsed by the WebView every time a file is opened. Of the ~830 KB
  added since the first version, the Cascadia Mono font embedded as base64 accounts for the
  bulk: a single variable file covers both every weight and Cyrillic, but on its own it costs
  almost half of the previous bundle. The other large contributors are
  `highlight.js/lib/common` (162 KB, 37 languages) and the HTML/CSS/JS grammars (212 KB),
  which `@codemirror/lang-markdown` pulls in to highlight HTML embedded in Markdown. The
  levers for shrinking it are known and measured, but deliberately left alone: they are what
  makes it match VS Code.
- **Markup punctuation in the editor.** CodeMirror tags **all** markup characters — `#`,
  `**`, `>`, backticks, `-` — with a single tag, so a heading's `#` cannot be a different
  colour from an emphasis `*`, as it is in VS Code. Every mark gets the theme's dimmed colour:
  visible, but not competing with the text. List text stays the body colour for the same
  reason, rather than taking the marker's colour.
- **`react-native-webview` types.** In 14.0.1 the component is declared as
  `class WebView<P = undefined> extends Component<WebViewProps & P>`: intersecting with
  `undefined` yields `never`, and the types reject every prop. In
  `src/webview/MarkdownWebView.tsx` this is worked around with one documented type
  assertion; it goes away when the library is updated.
- **Navigation.** Instead of `react-navigation`, a hand-rolled stack plus `BackHandler`.
  That leaves the app one native module lighter, and unsaved changes are protected by both
  the "Back" («Назад») button in the header and the hardware button.
- **Following links.** A link opens a new editor screen on top of the current one, so going
  back keeps the unsaved changes of the document you left.
- **Token on non-Android platforms.** `src/storage/tokenStore.ts` (the one the tests use)
  keeps the token in memory only: writing credentials to plain storage would be worse than
  asking for them again.
- **Android only.** The `ios/` project has been removed, and Windows is not supported.
