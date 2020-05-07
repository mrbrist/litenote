const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const isDev = require("electron-is-dev");

electron.Menu.setApplicationMenu(null);

var icon = electron.nativeImage.createFromPath(
  __dirname + "/../resources/icon.png"
);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 916,
    height: 539,
    minWidth: 916,
    minHeight: 539,
    icon: icon,
    name: "litenote",
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.on("closed", () => (mainWindow = null));
  mainWindow.openDevTools({ undocked: true });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
