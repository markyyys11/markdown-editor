[English](README.md) | [Русский](README.ru.md)

# Markdown Editor

Приложение для Android, которое редактирует Markdown-документы из репозиториев GitHub:
открывает файл, показывает исходник с подсветкой синтаксиса или рендер и коммитит
изменения прямо с телефона.

<a href="https://boosty.to/mrk_sn/posts/634e5095-2509-45a6-ae5e-190b22807878?share=success_publish_link">
  <img src="https://cdn.simpleicons.org/boosty" alt="Boosty" width="16" height="16">
  Поддержать
</a>

## Возможности

- **Два режима.** «Правка» показывает исходник Markdown целиком с подсветкой
  форматирования; «Просмотр» рендерит документ: заголовки, таблицы, списки задач,
  зачёркивание, цитаты и блоки кода с подсветкой синтаксиса.
- **Работа с репозиториями.** Вход по личному токену, список репозиториев с пагинацией,
  обход каталогов, переключение ветки, фильтр «только Markdown» и создание нового
  `.md`-файла.
- **Коммит.** Диалог с сообщением коммита; расхождение с GitHub («файл изменился»)
  распознаётся отдельно и предлагает перезагрузить документ.
- **Рабочие ссылки.** В превью относительные `.md` открываются в редакторе, остальные —
  в браузере.
- **Темы.** 65 тем VSCode с переключением на лету; одна палитра на редактор, превью и
  интерфейс приложения.

## Стек

| Уровень | Технология |
| --- | --- |
| Приложение | React Native 0.84.1 (Hermes, New Architecture), TypeScript |
| Редактор | CodeMirror 6 в WebView |
| Превью | markdown-it, highlight.js, DOMPurify |
| Сборка бандла | esbuild |
| Хранилище токена | react-native-keychain (Android Keystore) |
| Данные GitHub | Contents API |
| Темы | темы VSCode, отображённые на модель тем приложения |

## Требования

| Компонент | Версия |
| --- | --- |
| Node | ≥ 22.11 |
| JDK | 17 |
| Android SDK | platform 36, build-tools 36.0.0 |
| minSdk / targetSdk | 24 / 36 |

## Запуск

```shell
npm install
npm start          # Metro, в отдельном терминале
npm run android    # сборка и установка на устройство или эмулятор
```

## Токен GitHub

Приложению нужен личный токен доступа (PAT):

- классическому токену достаточно области `repo`;
- токену с тонкими правами — разрешение `Contents: Read and write`.

Токен проверяется запросом `GET /user` до сохранения и лежит в Keystore Android через
`react-native-keychain`.

## Команды

| Команда | Что делает |
| --- | --- |
| `npm start` | Metro |
| `npm run android` | сборка и установка на Android |
| `npm run build:webview` | пересборка бандла WebView из `webview-src/` |
| `npm run themes` | перегенерация тем из установленного расширения VSCode |
| `npm test` | Jest |
| `npm run typecheck` | `tsc` для приложения и отдельно для `webview-src` |
| `npm run lint` | ESLint |

## Структура проекта

```
shared/          типы протокола сообщений и палитра, общие для обоих миров
webview-src/     CodeMirror 6 и рендер превью, собирается esbuild-ом
scripts/         сборка бандла WebView и генерация тем
src/
  github/        клиент Contents API, base64, пути, разбор ссылок
  storage/       хранение токена (Android — Keystore)
  state/         сессия GitHub (AuthProvider)
  navigation/    стек экранов и защита несохранённых правок
  components/    элементы интерфейса
  screens/       токен → репозитории → каталог → редактор
  webview/       HTML-оболочка и хост WebView
  themes/        маппинг тем VSCode и провайдер темы
```

Правки в `webview-src/` требуют `npm run build:webview`: сгенерированный бандл
(`src/webview/bundle.generated.ts`) закоммичен и именно его грузит приложение.

## Ограничения

- **Только Android.** Проект `ios/` удалён, Windows не поддерживается.
- **Только онлайн.** Всё идёт через Contents API GitHub, поэтому ветки нельзя мёржить, а
  файлы больше 1 МБ недоступны.
- **Интерфейс на русском.**
