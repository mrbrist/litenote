<p align="center">
  <img width="200" src="./resources/logo.svg">
</p>

# litenote

A modern and simple note taking app built with electron and react

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
  notesStore.js   Reads and writes notes.json
src/
  index.jsx       Renderer entry point
  App/            Top-level component and state
  NoteList/, NoteCard/, Editor/, Titlebar/
  notes.js        Pure helpers for updating notes
  theme.js        Material UI theme
  test/           Test setup and a fake window.litenote API
e2e/              Playwright tests that launch the real app
```

The page never touches Node or Electron directly. Everything it needs (loading and saving notes, and which OS it is running on) goes through `window.litenote`, defined in `electron/preload.cjs`. `App` receives that object as its `api` prop, so tests can pass in the fake from `src/test/fakeApi.js` instead.

The renderer's libraries (React, Material UI, …) are bundled by Vite, so they live in `devDependencies`. Only add something to `dependencies` if the Electron main process needs it at runtime.

### Testing

Unit and component tests use [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com). Put them next to the code they test as `*.test.js` or `*.test.jsx`. Tests under `src/` run in a simulated browser (jsdom); tests under `electron/` run in Node.

End-to-end tests in `e2e/` use [Playwright](https://playwright.dev) to launch the real app. Each test gets a throwaway profile directory via the `LITENOTE_USER_DATA_DIR` environment variable, so your own notes are never touched.

### Where notes are stored

Notes are saved to `notes.json` in Electron's user data folder:

- macOS: `~/Library/Application Support/litenote/`
- Windows: `%APPDATA%\litenote\`
- Linux: `~/.config/litenote/`

### License

**litenote** is licensed with the [MIT](LICENSE) license
