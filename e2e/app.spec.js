import { _electron as electron, expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let userDataDir;

test.beforeEach(async () => {
  userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "litenote-e2e-"));
});

test.afterEach(async () => {
  await fs.rm(userDataDir, { recursive: true, force: true });
});

// Launches the built app with a throwaway profile so real notes are untouched.
async function launch() {
  const env = { ...process.env, LITENOTE_USER_DATA_DIR: userDataDir };
  delete env.ELECTRON_RENDERER_URL;
  const app = await electron.launch({ args: ["."], env });
  return { app, window: await app.firstWindow() };
}

async function savedNotes() {
  const file = path.join(userDataDir, "notes.json");
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return undefined;
  }
}

test("creates and edits a note that survives a restart", async () => {
  let { app, window } = await launch();
  await window.getByRole("button", { name: "New Note" }).click();
  await window.getByText("Note 0").click();
  await window.getByRole("textbox").fill("Hello from Playwright");

  await expect
    .poll(savedNotes)
    .toEqual({ notes: [{ id: 0, name: "Note 0", data: "Hello from Playwright" }] });
  await app.close();

  ({ app, window } = await launch());
  await window.getByText("Note 0").click();
  await expect(window.getByRole("textbox")).toHaveValue("Hello from Playwright");
  await app.close();
});

test("the back button returns to the list and keeps the last edit", async () => {
  const { app, window } = await launch();
  await window.getByRole("button", { name: "New Note" }).click();
  await window.getByText("Note 0").click();
  await window.getByRole("textbox").fill("typed just before going back");
  await window.getByRole("button", { name: "Notes" }).click();

  await expect(window.getByRole("button", { name: "New Note" })).toBeVisible();
  await expect
    .poll(savedNotes)
    .toEqual({ notes: [{ id: 0, name: "Note 0", data: "typed just before going back" }] });
  await app.close();
});

test("uses the platform's own window controls", async () => {
  const { app, window } = await launch();
  const platform = await app.evaluate(() => process.platform);
  await expect(window.locator(".Titlebar")).toHaveClass(new RegExp(`Titlebar--${platform}`));
  if (platform !== "darwin") {
    expect(await window.evaluate(() => navigator.windowControlsOverlay.visible)).toBe(true);
  }
  await app.close();
});
