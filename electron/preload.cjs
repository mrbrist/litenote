// Runs in a sandbox, so it must stay CommonJS and can only require "electron".
const { contextBridge, ipcRenderer } = require("electron");

// Everything the renderer is allowed to do outside the page. The renderer only
// talks to this object (window.litenote), which also makes it easy to fake in
// tests.
contextBridge.exposeInMainWorld("litenote", {
  platform: process.platform,
  notes: {
    load: () => ipcRenderer.invoke("notes:load"),
    save: (data) => ipcRenderer.invoke("notes:save", data),
  },
});
