import fs from "node:fs/promises";
import path from "node:path";

// Reads and writes the notes file. Kept free of Electron APIs so it can be
// unit tested with plain Node.
export function createNotesStore(filePath) {
  let lastWrite = Promise.resolve();

  return {
    async load() {
      try {
        return JSON.parse(await fs.readFile(filePath, "utf8"));
      } catch (err) {
        if (err.code === "ENOENT") return { notes: [] };
        throw err;
      }
    },

    save(data) {
      // Queue writes so an older save can never land after a newer one, and
      // write to a temp file first so a crash mid-write can't corrupt notes.
      const write = lastWrite.then(async () => {
        const tmpPath = `${filePath}.tmp`;
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(tmpPath, JSON.stringify(data));
        await fs.rename(tmpPath, filePath);
      });
      lastWrite = write.catch(() => {});
      return write;
    },
  };
}
