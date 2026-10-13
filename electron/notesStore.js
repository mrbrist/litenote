import fs from "node:fs/promises";
import path from "node:path";

// Reads and writes a JSON file, returning `empty` when it doesn't exist yet.
// Kept free of Electron APIs so it can be unit tested with plain Node.
export function createJsonStore(filePath, empty) {
  let lastWrite = Promise.resolve();

  return {
    async load() {
      try {
        return JSON.parse(await fs.readFile(filePath, "utf8"));
      } catch (err) {
        if (err.code === "ENOENT") return structuredClone(empty);
        throw err;
      }
    },

    save(data) {
      // Queue writes so an older save can never land after a newer one, and
      // write to a temp file first so a crash mid-write can't corrupt the file.
      const write = lastWrite.then(async () => {
        const tmpPath = `${filePath}.tmp`;
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(tmpPath, JSON.stringify(data));
        await fs.rename(tmpPath, filePath);
      });
      lastWrite = write.catch(() => {});
      return write;
    },

    // Resolves once every queued write has finished (successfully or not).
    flush() {
      return lastWrite;
    },
  };
}

export function createNotesStore(filePath) {
  return createJsonStore(filePath, { notes: [] });
}

export function createSettingsStore(filePath) {
  return createJsonStore(filePath, {});
}
