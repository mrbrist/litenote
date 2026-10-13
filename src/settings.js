import { SORT_OPTIONS } from "./notes";

// Fonts are bundled with the app (see src/fonts.js), and each stack falls
// back to a font the OS already has if one ever fails to load.
const MONO_FALLBACK = 'ui-monospace, "Cascadia Code", Consolas, Menlo, monospace';

export const FONTS = [
  { value: "jetbrains-mono", label: "JetBrains Mono", stack: `"JetBrains Mono", ${MONO_FALLBACK}`, ligatures: true },
  { value: "ibm-plex-mono", label: "IBM Plex Mono", stack: `"IBM Plex Mono", ${MONO_FALLBACK}`, ligatures: false },
  { value: "fira-code", label: "Fira Code", stack: `"Fira Code", ${MONO_FALLBACK}`, ligatures: true },
  {
    value: "system",
    label: "System",
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    ligatures: false,
  },
];

export const ACCENTS = [
  { value: "cyan", label: "Cyan", color: "#79c8d5" },
  { value: "blue", label: "Blue", color: "#8aaef0" },
  { value: "violet", label: "Violet", color: "#b4a0ec" },
  { value: "green", label: "Green", color: "#8fcf9c" },
  { value: "amber", label: "Amber", color: "#e3bb7a" },
];

export const FONT_SIZE = { min: 12, max: 22 };

export const DEFAULT_APPEARANCE = {
  accent: "cyan",
  font: "jetbrains-mono",
  fontSize: 15,
  ligatures: true,
};

export const DEFAULT_SETTINGS = {
  ...DEFAULT_APPEARANCE,
  showStatusBar: true,
  showWordCount: true,
  sort: "updated-desc",
  confirmDelete: true,
};

const oneOf = (options) => (value) => options.some((o) => o.value === value);
const isBoolean = (value) => typeof value === "boolean";

const VALIDATORS = {
  accent: oneOf(ACCENTS),
  font: oneOf(FONTS),
  fontSize: (value) =>
    Number.isInteger(value) && value >= FONT_SIZE.min && value <= FONT_SIZE.max,
  ligatures: isBoolean,
  showStatusBar: isBoolean,
  showWordCount: isBoolean,
  sort: oneOf(SORT_OPTIONS),
  confirmDelete: isBoolean,
};

// Keeps every valid stored setting and replaces anything missing, unknown or
// malformed with its default, so a damaged settings file can't break the app.
export function normalizeSettings(raw) {
  const settings = { ...DEFAULT_SETTINGS };
  if (raw && typeof raw === "object") {
    for (const [key, isValid] of Object.entries(VALIDATORS)) {
      if (isValid(raw[key])) settings[key] = raw[key];
    }
  }
  return settings;
}

export function findOption(options, value) {
  return options.find((o) => o.value === value) ?? options[0];
}

// Typography and accent are applied as CSS custom properties on <html>, so
// changing them restyles the app without re-rendering it.
export function applyAppearance(settings, root = document.documentElement) {
  const font = findOption(FONTS, settings.font);
  root.style.setProperty("--font-family", font.stack);
  root.style.setProperty("--editor-font-size", `${settings.fontSize}px`);
  root.style.setProperty(
    "--font-ligatures",
    settings.ligatures && font.ligatures ? "normal" : "none"
  );
  root.style.setProperty("--accent", findOption(ACCENTS, settings.accent).color);
}
