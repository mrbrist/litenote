<p align="center">
  <img width="200" src="./resources/logo.svg">
</p>

# litenote

A modern and simple note taking app built with electron and react

### Using litenote

- **Notes** live in the sidebar, showing each note's title, the start of its text, when it was last edited and its word count. Click one to open it.
- **New note**: the `+` button or `Ctrl+N` (`⌘N` on macOS). The new note opens with its title selected, so you can name it straight away.
- **Rename**: edit the title above the note (press `Enter` to save, `Escape` to cancel), or use **Rename** from a note's `…` menu or right-click menu. `F2` renames the focused note. A blank title becomes "Untitled Note".
- **Delete**: **Delete** from a note's menu, or the `Delete` key on a focused note in the list. litenote asks first (you can turn that off in Settings), and you can **Undo** for a few seconds afterwards.
- **Sort**: the control at the top of the list sorts by last edited, title or date created, either way round. Sorting never changes your notes.
- **Status bar**: words, characters, reading time, when the note was created and last edited, and whether it has been saved.
- **Settings** (`Ctrl+,` / `⌘,`): accent colour, font (JetBrains Mono, IBM Plex Mono, Fira Code or the system font), editor font size, ligatures, status bar and word count visibility, sort order and delete confirmation.
- Other shortcuts: `Ctrl+E` focuses the editor, `Ctrl+\` hides or shows the sidebar. Narrow windows show the list and the open note one at a time.

Notes save automatically half a second after you stop typing, and straight away when you switch notes, leave the text or close the window. If a save fails, litenote says so and offers to retry.

### Setup

You need [Node.js](https://nodejs.org) 24 (the version is pinned in `.nvmrc`, so `nvm use` picks it up) and npm.

Clone the repo, enter the folder and run:

```
npm install
npm start
```

`npm start` runs the Vite dev server and opens the app in Electron with hot reloading and DevTools.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Run the app in development mode |
| `npm test` | Run the unit and component tests once |
| `npm run test:watch` | Re-run tests as files change |
| `npm run test:e2e` | Build, then drive the real Electron app with Playwright |
| `npm run lint` | Lint the project with ESLint |
| `npm run build` | Build the renderer into `build/` |
| `npm run preview` | Build, then run the app from the production build |
| `npm run dist` | Build and package the app with electron-builder into `dist/` |

### Project layout

```
electron/
  main.js         Electron main process: window, IPC handlers
  preload.cjs     Exposes the window.litenote API to the page
  notesStore.js   Reads and writes notes.json and settings.json
src/
  index.jsx       Renderer entry point
  App/            Top-level component and state
  Sidebar/, NoteList/, NoteCard/, Editor/, StatusBar/, Titlebar/,
  SettingsDialog/, TitleInput/
  notes.js        Pure helpers for updating and sorting notes
  text.js         Word counts, previews and relative times
  settings.js     Settings, their defaults and validation
  useNotes.js     Holds the notes and saves every change
  index.css       Colour, type and spacing tokens
  theme.js        Material UI theme (mirrors the tokens in index.css)
  test/           Test setup and a fake window.litenote API
e2e/              Playwright tests that launch the real app
```

The page never touches Node or Electron directly. Everything it needs (loading and saving notes and settings, and which OS it is running on) goes through `window.litenote`, defined in `electron/preload.cjs`. `App` receives that object as its `api` prop, so tests can pass in the fake from `src/test/fakeApi.js` instead.

The renderer's libraries (React, Material UI, …) are bundled by Vite, so they live in `devDependencies`. Only add something to `dependencies` if the Electron main process needs it at runtime.

### Testing

Unit and component tests use [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com). Put them next to the code they test as `*.test.js` or `*.test.jsx`. Tests under `src/` run in a simulated browser (jsdom); tests under `electron/` run in Node.

End-to-end tests in `e2e/` use [Playwright](https://playwright.dev) to launch the real app. Each test gets a throwaway profile directory via the `LITENOTE_USER_DATA_DIR` environment variable, so your own notes are never touched.

### Where notes are stored

Notes are saved to `notes.json`, and settings to `settings.json`, in Electron's user data folder:

- macOS: `~/Library/Application Support/litenote/`
- Windows: `%APPDATA%\litenote\`
- Linux: `~/.config/litenote/`

Each note is stored as `{ id, name, data, createdAt, updatedAt }`, with times in milliseconds. Notes saved by earlier versions have no timestamps; they are read as they are, and get `updatedAt` the first time they are edited or renamed. If `notes.json` can't be read, litenote shows the error and saves nothing, so the file is never overwritten. A damaged `settings.json` just falls back to the defaults.

### License

**litenote** is licensed with the [MIT](LICENSE) license
