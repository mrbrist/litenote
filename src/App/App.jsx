import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import "./style.css";

import Titlebar from "../Titlebar/Titlebar";
import Sidebar from "../Sidebar/Sidebar";
import Editor from "../Editor/Editor";
import SettingsDialog from "../SettingsDialog/SettingsDialog";
import ConfirmDelete from "./ConfirmDelete";
import Notices from "./Notices";
import { createAppTheme } from "../theme";
import { NoteIcon, PlusIcon } from "../icons";
import { useNotes } from "../useNotes";
import {
  addNote,
  findNote,
  noteTitle,
  removeNote,
  renameNote,
  restoreNote,
  setNoteData,
  sortNotes,
} from "../notes";
import { ACCENTS, applyAppearance, findOption, normalizeSettings } from "../settings";

export const NARROW_QUERY = "(max-width: 699.95px)";

function shortcutLabel(platform) {
  return platform === "darwin" ? (key) => `⌘${key}` : (key) => `Ctrl+${key}`;
}

// `api` is window.litenote (see electron/preload.cjs). Tests pass a fake.
// Loads the notes and settings, then hands over to Workspace. If the notes
// can't be read, nothing is ever saved, so the file is left as it was.
export default function App({ api }) {
  const [loaded, setLoaded] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.notes.load().then(
        (notes) => ({ notes }),
        (error) => ({ error })
      ),
      // Settings are a convenience: if they can't be read, use the defaults.
      Promise.resolve()
        .then(() => api.settings?.load())
        .catch(() => undefined),
    ]).then(([result, settings]) => {
      if (!cancelled) setLoaded({ ...result, settings: normalizeSettings(settings) });
    });
    return () => {
      cancelled = true;
    };
  }, [api, attempt]);

  const settings = loaded?.settings;
  useLayoutEffect(() => {
    if (settings) applyAppearance(settings);
  }, [settings]);

  if (!loaded) return <div className="App" />;

  if (loaded.error || !Array.isArray(loaded.notes?.notes)) {
    return (
      <div className="App">
        <Titlebar platform={api.platform} title="litenote" />
        <div className="LoadError" role="alert">
          <h1>Your notes couldn't be opened</h1>
          <p>
            LiteNote couldn't read its notes file, so it hasn't changed anything. Nothing
            will be saved until the notes load.
          </p>
          {loaded.error && <pre>{String(loaded.error.message ?? loaded.error)}</pre>}
          <button type="button" className="primaryButton" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <Workspace api={api} initialNotes={loaded.notes} initialSettings={loaded.settings} />;
}

function Workspace({ api, initialNotes, initialSettings }) {
  const { notes, update, saving, saveError, retrySave } = useNotes(api, initialNotes);
  const [settings, setSettings] = useState(initialSettings);
  const [settingsError, setSettingsError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [focusTitle, setFocusTitle] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [undo, setUndo] = useState(null);
  const narrow = useMediaQuery(NARROW_QUERY, { noSsr: true });

  const shortcut = shortcutLabel(api.platform);
  const theme = useMemo(
    () => createAppTheme(findOption(ACCENTS, settings.accent).color),
    [settings.accent]
  );
  const sorted = useMemo(() => sortNotes(notes.notes, settings.sort), [notes, settings.sort]);
  const openNote = openId !== null ? findNote(notes, openId) : null;

  useLayoutEffect(() => applyAppearance(settings), [settings]);

  // Settings are applied straight away and saved to their own file.
  const latestSettings = useRef(initialSettings);
  const changeSettings = useCallback(
    (patch) => {
      const next = normalizeSettings({ ...latestSettings.current, ...patch });
      latestSettings.current = next;
      setSettings(next);
      Promise.resolve()
        .then(() => api.settings?.save(next))
        .then(
          () => setSettingsError(null),
          (error) => setSettingsError(error ?? new Error("Unknown error"))
        );
    },
    [api]
  );

  const openNoteById = useCallback((id) => {
    setFocusTitle(false);
    setOpenId(id);
  }, []);

  const createNote = useCallback(() => {
    const next = update((current) => addNote(current));
    setFocusTitle(true);
    setOpenId(next.notes.at(-1).id);
  }, [update]);

  const updateNote = useCallback(
    (id, data) => update((current) => setNoteData(current, id, data)),
    [update]
  );

  const rename = useCallback(
    (id, name) => update((current) => renameNote(current, id, name)),
    [update]
  );

  const endRename = useCallback((id, reason) => {
    setRenamingId(null);
    // Give focus back to the note in the list after Enter or Escape.
    if (reason !== "blur") {
      requestAnimationFrame(() =>
        document.querySelector(`button[data-note-id="${id}"]`)?.focus()
      );
    }
  }, []);

  const deleteNote = useCallback(
    (id) => {
      const index = notes.notes.findIndex((note) => note.id === id);
      if (index === -1) return;
      const note = notes.notes[index];
      if (id === openId) {
        // Move to the neighbouring note in the list, or to the list itself on
        // a narrow window.
        const position = sorted.findIndex((n) => n.id === id);
        const neighbour = sorted[position + 1] ?? sorted[position - 1];
        setOpenId(narrow || !neighbour ? null : neighbour.id);
        setFocusTitle(false);
      }
      update((current) => removeNote(current, id));
      setUndo({ note, index });
    },
    [notes, openId, sorted, narrow, update]
  );

  const requestDelete = useCallback(
    (id) => {
      const note = findNote(notes, id);
      if (!note) return;
      if (settings.confirmDelete) setConfirming(note);
      else deleteNote(id);
    },
    [notes, settings.confirmDelete, deleteNote]
  );

  const dismissUndo = useCallback(() => setUndo(null), []);

  const undoDelete = useCallback(() => {
    if (!undo) return;
    update((current) => restoreNote(current, undo.note, undo.index));
    setUndo(null);
  }, [undo, update]);

  // App-wide shortcuts. Ctrl on Windows and Linux, ⌘ on macOS. They pause
  // while a dialog is open.
  const dialogOpen = settingsOpen || Boolean(confirming);
  useEffect(() => {
    function handleKeyDown(e) {
      const mod = api.platform === "darwin" ? e.metaKey : e.ctrlKey;
      if (!mod || e.altKey || e.shiftKey || dialogOpen) return;
      const key = e.key.toLowerCase();
      const actions = {
        n: createNote,
        e: () => document.getElementById("EditorTE")?.focus(),
        ",": () => setSettingsOpen(true),
        "\\": () => setSidebarOpen((open) => !open),
      };
      if (actions[key]) {
        e.preventDefault();
        actions[key]();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [api.platform, createNote, dialogOpen]);

  const showSidebar = narrow ? !openNote : sidebarOpen;
  const showEditor = !narrow || Boolean(openNote);

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Titlebar
          platform={api.platform}
          title={openNote ? noteTitle(openNote) : "litenote"}
          onBack={narrow && openNote ? () => setOpenId(null) : undefined}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={narrow ? undefined : () => setSidebarOpen((open) => !open)}
          onOpenSettings={() => setSettingsOpen(true)}
          shortcut={shortcut}
        />
        <div className="AppBody">
          {showSidebar && (
            <Sidebar
              notes={sorted}
              sort={settings.sort}
              onSortChange={(sort) => changeSettings({ sort })}
              onCreate={createNote}
              shortcut={shortcut}
              openId={openId}
              renamingId={renamingId}
              showWordCount={settings.showWordCount}
              onOpen={openNoteById}
              onStartRename={setRenamingId}
              onRename={rename}
              onRenameEnd={endRename}
              onDelete={requestDelete}
            />
          )}
          {showEditor && (
            <main className="EditorPane">
              {openNote ? (
                <Editor
                  key={openNote.id}
                  note={openNote}
                  onChange={updateNote}
                  onRename={rename}
                  onDelete={requestDelete}
                  focusTitle={focusTitle}
                  saveStatus={saveError ? "error" : saving ? "saving" : "saved"}
                  onRetrySave={retrySave}
                  showStatusBar={settings.showStatusBar}
                  showWordCount={settings.showWordCount}
                />
              ) : (
                <div className="EmptyState">
                  <NoteIcon size={28} />
                  <p>
                    {notes.notes.length === 0
                      ? "You don't have any notes yet."
                      : "Pick a note from the list, or start a new one."}
                  </p>
                  <button type="button" className="primaryButton" onClick={createNote}>
                    <PlusIcon size={14} /> New note <kbd>{shortcut("N")}</kbd>
                  </button>
                </div>
              )}
            </main>
          )}
        </div>

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onChange={changeSettings}
          shortcut={shortcut}
        />
        <ConfirmDelete
          note={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            deleteNote(confirming.id);
            setConfirming(null);
          }}
        />
        <Notices
          undo={undo}
          onUndo={undoDelete}
          onDismissUndo={dismissUndo}
          saveError={saveError}
          onRetrySave={retrySave}
          settingsError={settingsError}
          onDismissSettingsError={() => setSettingsError(null)}
        />
      </div>
    </ThemeProvider>
  );
}
