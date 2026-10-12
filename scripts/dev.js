// Starts the Vite dev server and opens Electron against it. Closing the app
// window also stops the dev server.
import { spawn } from "node:child_process";
import electron from "electron";
import { createServer } from "vite";

const server = await createServer();
await server.listen();
server.printUrls();

const app = spawn(electron, ["."], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RENDERER_URL: server.resolvedUrls.local[0] },
});

app.on("exit", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
