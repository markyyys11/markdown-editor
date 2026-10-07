# QWEN.md

Инструкции для агентов, работающих с этим репозиторием.

## Что это за проект

Редактор Markdown-документов из репозиториев GitHub для **Android** (React Native).
Приложение открывает файл через GitHub Contents API, показывает исходник с подсветкой
синтаксиса («Правка») или рендер «как на github.com» («Просмотр») и коммитит изменения
прямо с телефона.

- **Платформа:** только Android. Каталог `ios/` удалён, Windows как целевая платформа
  не поддерживается.
- **Язык интерфейса:** весь текст UI и сообщения об ошибках — на русском. Код,
  идентификаторы и комментарии — на английском.
- **Два мира.** Нативный хост на React Native и редактор CodeMirror 6, собранный в
  WebView. Они общаются только сообщениями по контракту из `shared/protocol.ts`.

## Стек

| Компонент | Версия |
| --- | --- |
| Node | ≥ 22.11 |
| React Native | 0.84.1 (Hermes, New Architecture включены) |
| JDK | 17 (см. «Сборка Android») |
| Android SDK | platform 36, build-tools 36.0.0, NDK 27.1.12297006 |
| minSdk / targetSdk | 24 / 36 |
| applicationId | `com.markdowneditor` |

Редактор: CodeMirror 6 (`@codemirror/*`), превью: `markdown-it` + `highlight.js` +
`DOMPurify`. Сборка WebView-бандла: `esbuild`. Хранилище токена: `react-native-keychain`.

## Структура

```
App.tsx                     корень: SafeAreaProvider → ThemeProvider → AuthProvider → AppNavigator
shared/                     общее для хоста и WebView, без рантайм-зависимостей
  protocol.ts               контракт HostMessage / WebviewMessage + parseWebviewMessage
  theme.ts                  модель темы (ui / markup / preview / code)
  palette.ts                палитра
webview-src/                редактор и превью; собирается esbuild-ом в одну строку
  index.ts                  точка входа бандла: режимы, тема, документ, вставка символов
  editorState.ts            extension-список CodeMirror (тема — параметр, не константа)
  insert.ts                 чистые правила вставки разметки (pairing, step-over)
  preview.ts                Markdown → HTML через DOMPurify
  previewCss.ts, render.ts, theme.ts, fontFace.ts
  assets/CascadiaMono.ttf   шрифт редактора (SIL OFL), кладётся в бандл как data URL
  __tests__/                тесты webview-src
scripts/
  build-webview.mjs         esbuild → src/webview/bundle.generated.ts
  generate-themes.mjs       VSCode-темы → src/themes/generated/themes.ts
src/
  github/                   Contents API, base64-кодек, пути, разбор ссылок
  storage/                  tokenStore.android.ts (Keystore) + tokenStore.ts (память)
  state/AuthContext.tsx     сессия GitHub
  navigation/               свой стек экранов + защита несохранённых правок
  components/               элементы интерфейса
  screens/                  Token → Repos → Browse → Editor (+ Themes)
  webview/                  HTML-оболочка, хост WebView, сгенерированный бандл
  themes/                   маппинг тем VSCode, ThemeProvider, useThemedStyles
  markdown/symbols.ts       символы панели быстрых клавиш
  util/, theme/, hooks/
__tests__/                  тесты хоста (Jest)
```

## Команды

| Команда | Что делает |
| --- | --- |
| `npm install` | установка зависимостей |
| `npm start` | Metro (в отдельном терминале) |
| `npm run android` | сборка и установка на устройство/эмулятор |
| `npm run build:webview` | пересборка бандла WebView из `webview-src/` |
| `npm run themes` | перегенерация тем из установленного расширения VSCode |
| `npm run typecheck` | `tsc --noEmit` отдельно для приложения и для `webview-src` |
| `npm run lint` | ESLint |
| `npm test` | Jest |

`npm start` работает сразу: `src/webview/bundle.generated.ts` закоммичен. **`npm run
build:webview` нужен после любой правки в `webview-src/`** — иначе изменения не попадут
в приложение. Аналогично `src/themes/generated/themes.ts` закоммичен и пересобирается
только командой `npm run themes`.

## Ключевые инварианты архитектуры

Это места, где уже были ошибки; не ломайте их «упрощением».

- **Документ передаётся свойством, а не императивно.** `MarkdownWebView` получает
  `document` + `documentKey` как пропсы. Императивный `setDocument` через ref в момент
  монтирования был null и открывал каждый файл пустым (исправлено в `540ce5e`).
  Императивными остаются только команды-реакции на жест (вставка символа) — к моменту
  нажатия страница заведомо смонтирована.
- **Тема приходит первой.** Страница держит панели скрытыми до `setTheme`; обработчик
  `ready` отправляет тему до `setMode` и `setDocument`, иначе редактор рисуется в чужой
  палитре (тёмная вспышка на светлой теме).
- **Тема — параметр построения состояния.** `createDocumentState(content, theme, ...)` и
  `createEditorExtensions(theme)` принимают тему аргументом. При перезагрузке документа
  состояние собирается заново, и тема, выставленная только рантайм-реконфигурацией,
  иначе теряется (исправлено в `b8502b0`).
- **`currentText` в хосте.** Страница может перезапуститься (Android отберёт рендерер
  WebView); обработчик `ready` заново шлёт текущий текст, поэтому ссылка обновляется и
  при наборе, и при перезагрузке.
- **Общий контракт.** Меняете сообщение — правьте `shared/protocol.ts` и обе стороны
  (`src/webview/MarkdownWebView.tsx`, `webview-src/index.ts`, `parseWebviewMessage`).
- **Своя навигация.** Вместо `react-navigation` — стек в `AppNavigator` + `BackHandler`.
  Экраны ниже верхнего остаются смонтированными, поэтому возврат сохраняет каталог,
  скролл, ветку и несохранённые правки. Слушатель `BackHandler` регистрируется ровно
  один раз — экран редактора (защита правок) должен получить событие позже.
- **Contents API, а не git.** `isomorphic-git` требует fs-адаптера, которого нет в
  `react-native-fs` на Android. Цена: только онлайн, нельзя мёржить ветки, файлы > 1 МБ
  недоступны (сообщается отдельным текстом). Конфликт sha (409/422) — сценарий «файл
  изменился на GitHub» с предложением перезагрузить.
- **Санитайз превью обязателен.** Документ приходит из чужих репозиториев, а WebView
  дотягивается до моста в RN. Весь HTML проходит через `DOMPurify` (см. `preview.ts`).

## Заметки по реализации

Инженерные пояснения «почему так» — перенесено сюда из README, чтобы README оставался
описанием проекта и стека.

### Почему WebView

Редактор — CodeMirror 6, тот же класс редактора, что лежит в основе VSCode. Собрать его
напрямую в React Native нельзя, поэтому `webview-src/` собирается esbuild-ом в одну строку
JS (`src/webview/bundle.generated.ts`, файл закоммичен) и подставляется в HTML. Ручной шаг
сборки не нужен: `npm start` работает сразу.

Хост и страница общаются только сообщениями (`shared/protocol.ts`): хост шлёт `setTheme`,
`setMode`, `setDocument`, `insert`; страница отвечает `ready`, `change`, `openLink`,
`error`. Фон HTML-оболочки прозрачный — за ним контейнер React Native, уже окрашенный в
активную тему, поэтому на светлой теме нет тёмной вспышки при открытии файла.

### Превью: почему стили свои

Цвета берутся из тех же ключей, которыми VSCode рисует свой предпросмотр Markdown
(`textLink`, `textBlockQuote`, `textCodeBlock`, `textPreformat`), поэтому превью следует
теме так же, как сам VSCode. Разметку делает `markdown-it` (таблицы, зачёркивание, списки
задач, автолинки), блоки кода — `highlight.js` с раскраской из `tokenColors` темы, а сырой
HTML из документа проходит через `DOMPurify`.

Пакетные стили не подошли бы: у `github-markdown-css` цвета зашиты литералами,
переопределять их пришлось бы поселекторно, а всё непереопределённое осталось бы в чужой
палитре — что и вылезает на светлой теме.

### Темы и шрифт

`npm run themes` читает установленное расширение
(`%USERPROFILE%\.vscode\extensions\beardedbear.beardedtheme-*`), прогоняет каждую тему через
правила `src/themes/mapVscodeTheme.ts` и пишет `src/themes/generated/themes.ts` (файл
закоммичен, поэтому сборка не требует ни VSCode, ни самого расширения на машине).

Подсветка берётся из **настоящих `tokenColors`**, а не подбирается на глаз: для каждой роли
разметки ищется селектор, являющийся префиксом скоупа токена на границе точки, и выигрывает
самый длинный — правило TextMate. Разбор по подстроке неверен и опасен тем, что незаметен:
селектор `punctuation.definition.list.begin.python` начинает отвечать на вопрос про
markdown-список.

Шрифт редактора — **Cascadia Mono** (SIL OFL, прямой преемник Consolas, на котором этот
VSCode фактически и работает). Он вариативный, поэтому один файл 625 КБ даёт все начертания,
а покрытие кириллицы проверено до вложения: Consolas и Segoe UI копировать в APK нельзя —
это проприетарные шрифты Microsoft.

### Размер бандла

WebView-бандл — ~1.67 МБ минифицированного JS; он лежит строкой в бандле приложения
(~3.9 МБ) и разбирается WebView при каждом открытии файла. Из прироста ~830 КБ относительно
первой версии большую часть даёт шрифт Cascadia Mono в base64: вариативный файл покрывает и
все начертания, и кириллицу, но один стоит почти как половина прежнего бандла. Остальные
крупные вклады: `highlight.js/lib/common` (162 КБ, 37 языков) и грамматики HTML/CSS/JS
(212 КБ), которые `@codemirror/lang-markdown` тянет ради подсветки встроенного в Markdown
HTML. Рычаги уменьшения известны и измерены, но намеренно не тронуты: они дают совпадение с
VSCode.

## Соглашения разработки

- **Prettier** (`.prettierrc.js`): `arrowParens: 'avoid'`, `singleQuote: true`,
  `trailingComma: 'all'`.
- **ESLint** (`.eslintrc.js`): extends `@react-native`. Сгенерированные файлы
  (`src/webview/bundle.generated.ts`, `src/themes/generated/`) исключены. Правило
  `no-void` разрешает `void promise()` как явный fire-and-forget — используйте его для
  намеренно непрошеных промисов вместо «висящего» вызова.
- **TypeScript.** Приложение наследует `@react-native/typescript-config`; `webview-src`
  компилируется отдельным `webview-src/tsconfig.json` в строгом режиме (в т.ч.
  `exactOptionalPropertyTypes`, `noUnusedLocals`). Проверка обеих конфигураций —
  `npm run typecheck`.
- **Комментарии** поясняют *почему*, а не *что*; хрупкие решения и обходы
  документируются на месте (например, приведение типов `react-native-webview`).
- **Не редактируйте сгенерированное вручную** — правьте источник в `webview-src/` /
  `mapVscodeTheme.ts` и пересобирайте.
- **Никаких секретов.** Токен GitHub живёт в Android Keystore через
  `react-native-keychain`; на прочих платформах (тесты) — только в памяти.

## Тесты

Jest с пресетом `react-native`. Тесты лежат в двух местах: `__tests__/` (хост) и
`webview-src/__tests__/` (редактор/превью). `jest.config.js` подменяет `.ttf` на
заглушку `webview-src/__mocks__/fontStub.js`, потому что esbuild превращает шрифт в
data URL, а Jest не умеет его грузить.

Покрыты: base64-кодек (кириллица), пути, разбор ссылок, протокол, классификация ошибок
GitHub, экранирование HTML-оболочки, правила вставки символов, рендер превью, перенос
тем (правило TextMate, запасные цвета, полнота и контраст всех тем). Перед завершением
изменения прогоните `npm run typecheck`, `npm run lint`, `npm test`.

## Что проверено

- `npm run typecheck` (обе конфигурации) и `npm run lint` — без замечаний.
- `npm test` — 130 тестов Jest в 13 наборах.
- `readFile` сверен побайтово с живыми файлами GitHub, включая README на 41 КБ с 90
  не-ASCII символами; цвета ролей разметки — с независимым разбором установленной темы.
- Сборка APK (локально и в GitHub Actions) и запуск на физическом телефоне пользователя.

## Сборка Android

`gradlew` требует **JDK 17** (React Native Gradle Plugin жёстко пинует toolchain 17;
JDK 21/27 отклоняются) и Android SDK. На этой машине они лежат вне PATH — переменные
передаются инлайном для одной команды, глобальные переменные не трогаем:

```shell
set JAVA_HOME=C:\Users\moon\Documents\projects\tools\jdk-17
set ANDROID_HOME=C:\Users\moon\Documents\projects\tools\android-sdk
android\gradlew.bat -p android assembleDebug
```

Первая сборка долгая (Gradle, затем компиляция C++ под 4 ABI). Для release на Windows
используйте **короткий путь** к копии репозитория (например `C:\md-build`): ninja падает
с «Filename longer than 260 characters», потому что относительный путь сборки выходит за
лимит при длинном корне. Копируйте без `.git`, `.qwen` и каталогов сборки.

Проверка на устройстве — на физическом телефоне пользователя (release APK). Эмулятор не
используется; скриншоты этот агент читать не умеет, поэтому симптомы описываются словами.

## Известные обходы

- **Типы `react-native-webview` 14.0.1.** Компонент объявлен как
  `class WebView<P = undefined>`, пересечение с `undefined` даёт `never` и отвергает все
  пропсы. В `src/webview/MarkdownWebView.tsx` это лечится одним документированным
  приведением типа; уйдёт при обновлении библиотеки.
- **Пунктуация разметки.** CodeMirror помечает все знаки разметки одним тегом, поэтому
  `#` заголовка не может отличаться по цвету от `*`; все получают приглушённый `fgSubtle`.
```
