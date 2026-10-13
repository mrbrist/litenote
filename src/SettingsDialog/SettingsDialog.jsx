import { useId } from "react";
import Dialog from "@mui/material/Dialog";
import Switch from "@mui/material/Switch";
import "./style.css";

import { CheckIcon } from "../icons";
import { SORT_OPTIONS } from "../notes";
import {
  ACCENTS,
  DEFAULT_APPEARANCE,
  DEFAULT_SETTINGS,
  FONT_SIZE,
  FONTS,
  findOption,
} from "../settings";

function Section({ title, children, action }) {
  return (
    <section className="SettingsSection">
      <div className="SettingsSection-header">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, hint, control, labelFor }) {
  const Label = labelFor ? "label" : "span";
  return (
    <div className="SettingsRow">
      <div className="SettingsRow-text">
        <Label htmlFor={labelFor}>{label}</Label>
        {hint && <span className="SettingsRow-hint">{hint}</span>}
      </div>
      {control}
    </div>
  );
}

function Toggle({ label, hint, checked, disabled, onChange }) {
  const id = useId();
  return (
    <Row
      label={label}
      hint={hint}
      labelFor={id}
      control={
        <Switch
          size="small"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
    />
  );
}

// A set of radio buttons drawn as tiles; arrow keys move between them.
function RadioTiles({ label, options, value, onChange, className, renderOption }) {
  function handleKeyDown(e, index) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    e.currentTarget.parentElement.children[next].focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {renderOption(option, checked)}
          </button>
        );
      })}
    </div>
  );
}

const SHORTCUTS = [
  ["N", "New note"],
  ["E", "Focus the editor"],
  ["\\", "Show or hide the sidebar"],
  [",", "Open settings"],
];

export default function SettingsDialog({ open, onClose, settings, onChange, shortcut }) {
  const font = findOption(FONTS, settings.font);
  const sortId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      scroll="paper"
      aria-labelledby="SettingsTitle"
      slotProps={{ paper: { className: "SettingsDialog" } }}
    >
      <header className="SettingsDialog-header">
        <h2 id="SettingsTitle">Settings</h2>
        <button type="button" className="ghostButton" onClick={onClose}>
          Done
        </button>
      </header>

      <div className="SettingsDialog-body">
        <Section
          title="Appearance"
          action={
            <button
              type="button"
              className="ghostButton SettingsReset"
              onClick={() => onChange(DEFAULT_APPEARANCE)}
            >
              Reset appearance
            </button>
          }
        >
          <Row
            label="Accent colour"
            control={
              <RadioTiles
                label="Accent colour"
                className="AccentPicker"
                options={ACCENTS}
                value={settings.accent}
                onChange={(accent) => onChange({ accent })}
                renderOption={(option, checked) => (
                  <span className="AccentSwatch" style={{ "--swatch": option.color }}>
                    {checked && <CheckIcon size={12} />}
                  </span>
                )}
              />
            }
          />

          <div className="SettingsRow SettingsRow--stacked">
            <span className="SettingsRow-text">Font</span>
            <RadioTiles
              label="Font"
              className="FontPicker"
              options={FONTS}
              value={settings.font}
              onChange={(value) => onChange({ font: value })}
              renderOption={(option, checked) => (
                <>
                  <span className="FontPicker-name">
                    {option.label}
                    {checked && <CheckIcon size={14} />}
                  </span>
                  <span className="FontPicker-sample" style={{ fontFamily: option.stack }}>
                    {"Aa 0O {} => !="}
                  </span>
                </>
              )}
            />
          </div>

          <Row
            label="Editor font size"
            control={
              <div className="Stepper" role="group" aria-label="Editor font size">
                <button
                  type="button"
                  className="ghostButton"
                  aria-label="Decrease font size"
                  disabled={settings.fontSize <= FONT_SIZE.min}
                  onClick={() => onChange({ fontSize: settings.fontSize - 1 })}
                >
                  −
                </button>
                <output aria-live="polite">{settings.fontSize}px</output>
                <button
                  type="button"
                  className="ghostButton"
                  aria-label="Increase font size"
                  disabled={settings.fontSize >= FONT_SIZE.max}
                  onClick={() => onChange({ fontSize: settings.fontSize + 1 })}
                >
                  +
                </button>
              </div>
            }
          />

          <Toggle
            label="Font ligatures"
            hint={
              font.ligatures
                ? "Joins character pairs like => and != into one symbol."
                : `${font.label} has no ligatures.`
            }
            checked={settings.ligatures && font.ligatures}
            disabled={!font.ligatures}
            onChange={(ligatures) => onChange({ ligatures })}
          />
        </Section>

        <Section title="Editor">
          <Toggle
            label="Status bar"
            hint="Statistics, timestamps and save status below the editor."
            checked={settings.showStatusBar}
            onChange={(showStatusBar) => onChange({ showStatusBar })}
          />
          <Toggle
            label="Word counts"
            hint="In the status bar and the note list."
            checked={settings.showWordCount}
            onChange={(showWordCount) => onChange({ showWordCount })}
          />
          <p className="SettingsNote">Notes save automatically as you type.</p>
        </Section>

        <Section title="Notes">
          <Row
            label="Sort notes by"
            labelFor={sortId}
            control={
              <select
                id={sortId}
                className="SettingsSelect"
                value={settings.sort}
                onChange={(e) => onChange({ sort: e.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            }
          />
          <Toggle
            label="Confirm before deleting"
            hint="Deleted notes can be restored with Undo for a few seconds either way."
            checked={settings.confirmDelete}
            onChange={(confirmDelete) => onChange({ confirmDelete })}
          />
        </Section>

        <Section title="Keyboard">
          <dl className="ShortcutList">
            {SHORTCUTS.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  <kbd>{shortcut(key)}</kbd>
                </dd>
              </div>
            ))}
            <div>
              <dt>Rename the note</dt>
              <dd>
                <kbd>F2</kbd>
              </dd>
            </div>
          </dl>
        </Section>
      </div>

      <footer className="SettingsDialog-footer">
        <button type="button" className="ghostButton" onClick={() => onChange(DEFAULT_SETTINGS)}>
          Reset all settings
        </button>
      </footer>
    </Dialog>
  );
}
