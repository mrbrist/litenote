import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
} from "electron";
import path from "node:path";

import { createNotesStore, createSettingsStore } from "./notesStore.js";

// Set by `npm start` to the Vite dev server; otherwise the built renderer is
// loaded from build/.
const rendererUrl = process.env.ELECTRON_RENDERER_URL;

// Lets tests run against a throwaway profile instead of the real notes.
if (process.env.LITENOTE_USER_DATA_DIR) {
  app.setPath("userData", process.env.LITENOTE_USER_DATA_DIR);
}

Menu.setApplicationMenu(null);
nativeTheme.themeSource = "dark";

// Keep in sync with the titlebar height and the colour tokens in src/index.css.
const TITLEBAR_HEIGHT = 36;
const BACKGROUND = "#111318";
const TITLEBAR_BACKGROUND = "#111318";
const TITLEBAR_SYMBOLS = "#9299a6";

// Use each platform's own window controls: traffic lights on macOS, and the
// system minimise/maximise/close overlay on Windows and Linux.
const titleBarOptions =
  process.platform === "darwin"
    ? { titleBarStyle: "hidden", trafficLightPosition: { x: 12, y: 11 } }
    : {
        titleBarStyle: "hidden",
        titleBarOverlay: {
          color: TITLEBAR_BACKGROUND,
          symbolColor: TITLEBAR_SYMBOLS,
          height: TITLEBAR_HEIGHT,
        },
      };

const icon = nativeImage.createFromPath(
  path.join(import.meta.dirname, "../resources/icon.png")
);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 660,
    minWidth: 420,
    minHeight: 320,
    icon: icon,
    backgroundColor: BACKGROUND,
    ...titleBarOptions,
    webPreferences: {
      preload: path.join(import.meta.dirname, "preload.cjs"),
    },
  });

  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: "undocked" });
  } else {
    mainWindow.loadFile(path.join(import.meta.dirname, "../build/index.html"));
  }

  mainWindow.on("closed", () => (mainWindow = null));
}

function registerIpcHandlers(stores) {
  for (const [name, store] of Object.entries(stores)) {
    ipcMain.handle(`${name}:load`, () => store.load());
    ipcMain.handle(`${name}:save`, (_event, data) => store.save(data));
  }
}

let stores = {};
let quitting = false;

app.whenReady().then(() => {
  const userData = app.getPath("userData");
  stores = {
    notes: createNotesStore(path.join(userData, "notes.json")),
    settings: createSettingsStore(path.join(userData, "settings.json")),
  };
  registerIpcHandlers(stores);
  createWindow();

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

// The page saves its last edits as the window closes; let those writes reach
// the disk before the process exits.
app.on("will-quit", (event) => {
  if (quitting) return;
  event.preventDefault();
  quitting = true;
  Promise.all(Object.values(stores).map((store) => store.flush())).finally(() =>
    app.quit()
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
