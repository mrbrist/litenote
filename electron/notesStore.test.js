import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createNotesStore, createSettingsStore } from "./notesStore.js";

let dir;
let file;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "litenote-test-"));
  file = path.join(dir, "nested", "notes.json");
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const notes = { notes: [{ id: 0, name: "Note 0", data: "hello" }] };

describe("createNotesStore", () => {
  it("loads an empty notebook when no file exists yet", async () => {
    expect(await createNotesStore(file).load()).toEqual({ notes: [] });
  });

  it("saves notes and loads them back", async () => {
    await createNotesStore(file).save(notes);
    expect(await createNotesStore(file).load()).toEqual(notes);
  });

  it("writes plain JSON and leaves no temp file behind", async () => {
    await createNotesStore(file).save(notes);
    expect(await fs.readFile(file, "utf8")).toBe(JSON.stringify(notes));
    expect(await fs.readdir(path.dirname(file))).toEqual(["notes.json"]);
  });

  it("keeps the last save when several are in flight", async () => {
    const store = createNotesStore(file);
    const saves = ["a", "b", "c"].map((data) =>
      store.save({ notes: [{ id: 0, name: "Note 0", data }] })
    );
    await Promise.all(saves);
    expect((await store.load()).notes[0].data).toBe("c");
  });

  it("keeps saving after a failed write", async () => {
    const store = createNotesStore(file);
    await expect(store.save({ toJSON: () => { throw new Error("boom"); } })).rejects.toThrow("boom");
    await store.save(notes);
    expect(await store.load()).toEqual(notes);
  });

  it("reports a corrupt notes file instead of overwriting it", async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, "{ not json");
    await expect(createNotesStore(file).load()).rejects.toThrow(SyntaxError);
  });
});

describe("flush", () => {
  it("waits for queued writes to finish", async () => {
    const store = createNotesStore(file);
    store.save(notes);
    await store.flush();
    expect(JSON.parse(await fs.readFile(file, "utf8"))).toEqual(notes);
  });

  it("resolves even when a write failed", async () => {
    const store = createNotesStore(file);
    store.save({ toJSON: () => { throw new Error("boom"); } }).catch(() => {});
    await expect(store.flush()).resolves.toBeUndefined();
  });
});

describe("createSettingsStore", () => {
  it("loads empty settings when no file exists yet", async () => {
    expect(await createSettingsStore(file).load()).toEqual({});
  });

  it("saves settings and loads them back", async () => {
    await createSettingsStore(file).save({ font: "fira-code" });
    expect(await createSettingsStore(file).load()).toEqual({ font: "fira-code" });
  });
});
