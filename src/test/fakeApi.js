import { vi } from "vitest";

// Stand-in for window.litenote (electron/preload.cjs) in renderer tests.
export function createFakeApi(notes = [], platform = "darwin") {
  return {
    platform,
    notes: {
      load: vi.fn().mockResolvedValue({ notes }),
      save: vi.fn().mockResolvedValue(undefined),
    },
  };
}
