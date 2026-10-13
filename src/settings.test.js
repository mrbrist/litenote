import { describe, expect, it } from "vitest";
import { applyAppearance, DEFAULT_SETTINGS, normalizeSettings } from "./settings";

describe("normalizeSettings", () => {
  it("uses the defaults when nothing is stored", () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings("nonsense")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid stored values", () => {
    const stored = { font: "fira-code", fontSize: 18, sort: "title-asc", confirmDelete: false };
    expect(normalizeSettings(stored)).toEqual({ ...DEFAULT_SETTINGS, ...stored });
  });

  it("replaces invalid values with defaults and drops unknown keys", () => {
    expect(
      normalizeSettings({
        font: "Comic Sans",
        fontSize: 99,
        ligatures: "yes",
        sort: "random",
        accent: null,
        unknown: 1,
      })
    ).toEqual(DEFAULT_SETTINGS);
  });
});

describe("applyAppearance", () => {
  it("sets the font, size, ligatures and accent as CSS variables", () => {
    const root = document.createElement("div");
    applyAppearance({ ...DEFAULT_SETTINGS, font: "fira-code", fontSize: 17 }, root);
    expect(root.style.getPropertyValue("--font-family")).toMatch(/^"Fira Code", .*monospace$/);
    expect(root.style.getPropertyValue("--editor-font-size")).toBe("17px");
    expect(root.style.getPropertyValue("--font-ligatures")).toBe("normal");
    expect(root.style.getPropertyValue("--accent")).toBe("#79c8d5");
  });

  it("turns ligatures off when disabled or unsupported by the font", () => {
    const root = document.createElement("div");
    applyAppearance({ ...DEFAULT_SETTINGS, ligatures: false }, root);
    expect(root.style.getPropertyValue("--font-ligatures")).toBe("none");
    applyAppearance({ ...DEFAULT_SETTINGS, font: "ibm-plex-mono" }, root);
    expect(root.style.getPropertyValue("--font-ligatures")).toBe("none");
  });
});
