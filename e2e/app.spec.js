// Callbacks passed to window.evaluate() run in the page.
/* global document */
import { _electron as electron, expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let userDataDir;
let running = [];

test.beforeEach(async () => {
  userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "litenote-e2e-"));
});

test.afterEach(async () => {
  // A failed test can leave the app open, which keeps the profile locked.
  for (const child of running) child.kill();
  running = [];
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});

// Launches the built app with a throwaway profile so real notes are untouched.
async function launch() {
  const env = { ...process.env, LITENOTE_USER_DATA_DIR: userDataDir };
  delete env.ELECTRON_RENDERER_URL;
  const app = await electron.launch({ args: ["."], env });
  running.push(app.process());
  return { app, window: await app.firstWindow() };
}

async function readJson(name) {
  try {
    return JSON.parse(await fs.readFile(path.join(userDataDir, name), "utf8"));
  } catch {
    return undefined;
  }
}

const savedNotes = () => readJson("notes.json");

// Closes the window the way a user would, which quits the app (on Windows and
// Linux) once the page has saved its last edits. Playwright's app.close()
// can hang on Windows, and it skips the page's beforeunload handler.
async function quit(app) {
  const exited = new Promise((resolve) => app.process().once("exit", resolve));
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
  if (process.platform === "darwin") await app.evaluate(({ app }) => app.quit());
  await exited;
}

const timestamped = (note) => ({
  ...note,
  createdAt: expect.any(Number),
  updatedAt: expect.any(Number),
});

test("creates and edits a note that survives a restart", async () => {
  let { app, window } = await launch();
  await window.getByRole("button", { name: "New Note", exact: true }).click();
  await window.getByLabel("Note text").fill("Hello from Playwright");

  await expect
    .poll(savedNotes)
    .toEqual({ notes: [timestamped({ id: 0, name: "Note 0", data: "Hello from Playwright" })] });
  await quit(app);

  ({ app, window } = await launch());
  await window.getByRole("list", { name: "Notes" }).getByText("Note 0").click();
  await expect(window.getByLabel("Note text")).toHaveValue("Hello from Playwright");
  await expect(window.getByText("3 words")).toHaveCount(2); // list and status bar
  await quit(app);
});

test("keeps the last keystrokes when the window is closed straight away", async () => {
  const { app, window } = await launch();
  await window.getByRole("button", { name: "New Note", exact: true }).click();
  await window.getByLabel("Note text").fill("typed just before closing");
  await quit(app);

  expect(await savedNotes()).toEqual({
    notes: [timestamped({ id: 0, name: "Note 0", data: "typed just before closing" })],
  });
});

test("opens notes saved by older versions without changing them", async () => {
  const legacy = { notes: [{ id: 0, name: "Note 0", data: "old text" }] };
  await fs.writeFile(path.join(userDataDir, "notes.json"), JSON.stringify(legacy));

  const { app, window } = await launch();
  await window.getByText("Note 0").click();
  await expect(window.getByLabel("Note text")).toHaveValue("old text");
  await quit(app);

  expect(await savedNotes()).toEqual(legacy);
});

test("renames and deletes notes", async () => {
  const { app, window } = await launch();
  await window.getByRole("button", { name: "New Note", exact: true }).click();
  await window.getByLabel("Note title").fill("Groceries");
  await window.getByLabel("Note title").press("Enter");
  await window.getByLabel("Note text").fill("milk");

  await expect.poll(savedNotes).toEqual({
    notes: [timestamped({ id: 0, name: "Groceries", data: "milk" })],
  });

  await window.getByRole("button", { name: "Note actions" }).click();
  await window.getByRole("menuitem", { name: /Delete/ }).click();
  await window.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect.poll(savedNotes).toEqual({ notes: [] });
  await quit(app);
});

test("remembers typography settings", async () => {
  let { app, window } = await launch();
  await window.getByRole("button", { name: "Settings" }).click();
  await window.getByRole("radio", { name: "Fira Code" }).click();
  await window.getByRole("button", { name: "Increase font size" }).click();
  await expect.poll(() => readJson("settings.json")).toMatchObject({
    font: "fira-code",
    fontSize: 16,
  });
  await quit(app);

  ({ app, window } = await launch());
  await expect
    .poll(() =>
      window.evaluate(() => document.documentElement.style.getPropertyValue("--font-family"))
    )
    .toMatch(/^"Fira Code"/);
  // The bundled font file loads.
  expect(
    await window.evaluate(async () => (await document.fonts.load('16px "Fira Code"')).length)
  ).toBeGreaterThan(0);
  await quit(app);
});

test("uses the platform's own window controls", async () => {
  const { app, window } = await launch();
  const platform = await app.evaluate(() => process.platform);
  await expect(window.locator(".Titlebar")).toHaveClass(new RegExp(`Titlebar--${platform}`));
  if (platform !== "darwin") {
    expect(await window.evaluate(() => navigator.windowControlsOverlay.visible)).toBe(true);
  }
  await quit(app);
});
