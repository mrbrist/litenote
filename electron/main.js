import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
} from "electron";
import path from "node:path";

import { createNotesStore } from "./notesStore.js";

// Set by `npm start` to the Vite dev server; otherwise the built renderer is
// loaded from build/.
const rendererUrl = process.env.ELECTRON_RENDERER_URL;

// Lets tests run against a throwaway profile instead of the real notes.
if (process.env.LITENOTE_USER_DATA_DIR) {
  app.setPath("userData", process.env.LITENOTE_USER_DATA_DIR);
}

Menu.setApplicationMenu(null);
nativeTheme.themeSource = "dark";

// Keep in sync with the titlebar height and colours in src/Titlebar/style.css.
const TITLEBAR_HEIGHT = 36;
const BACKGROUND = "#121212";
const TITLEBAR_BACKGROUND = "#1e1e1e";

// Use each platform's own window controls: traffic lights on macOS, and the
// system minimise/maximise/close overlay on Windows and Linux.
const titleBarOptions =
  process.platform === "darwin"
    ? { titleBarStyle: "hidden", trafficLightPosition: { x: 12, y: 11 } }
    : {
        titleBarStyle: "hidden",
        titleBarOverlay: {
          color: TITLEBAR_BACKGROUND,
          symbolColor: "#e0e0e0",
          height: TITLEBAR_HEIGHT,
        },
      };

const icon = nativeImage.createFromPath(
  path.join(import.meta.dirname, "../resources/icon.png")
);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 560,
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

function registerIpcHandlers(store) {
  ipcMain.handle("notes:load", () => store.load());
  ipcMain.handle("notes:save", (_event, data) => store.save(data));
}

app.whenReady().then(() => {
  registerIpcHandlers(
    createNotesStore(path.join(app.getPath("userData"), "notes.json"))
  );
  createWindow();

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
