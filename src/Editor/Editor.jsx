import { useEffect, useRef, useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import "./style.css";

import TitleInput from "../TitleInput/TitleInput";
import StatusBar from "../StatusBar/StatusBar";
import { MoreIcon, PencilIcon, TrashIcon } from "../icons";
import { UNTITLED } from "../notes";

export const SAVE_DELAY_MS = 500;

// The open note. Mount it with `key={note.id}`: the text area is uncontrolled
// and only reads the note's text when it mounts, so typing never re-renders
// anything outside the editor until the text is saved.
export default function Editor({
  note,
  onChange,
  onRename,
  onDelete,
  saveStatus = "saved",
  onRetrySave,
  showStatusBar = true,
  showWordCount = true,
  focusTitle = false,
}) {
  const [text, setText] = useState(note.data);
  const [savedText, setSavedText] = useState(note.data);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const pendingSave = useRef(null);
  const titleRef = useRef(null);
  const textRef = useRef(null);

  // Save once typing has paused. Nothing is saved until the text changes.
  useEffect(() => {
    pendingSave.current = null;
    if (text === savedText) return;
    const save = () => {
      pendingSave.current = null;
      setSavedText(text);
      onChange(note.id, text);
    };
    pendingSave.current = save;
    const timeout = setTimeout(save, SAVE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [text, savedText, note.id, onChange]);

  // Don't lose the last few keystrokes when switching notes, going back to
  // the list, reloading or closing the window.
  useEffect(() => {
    const flush = () => pendingSave.current?.();
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  function renameNote() {
    setMenuAnchor(null);
    titleRef.current?.focus();
    titleRef.current?.select();
  }

  return (
    <div
      className="Editor"
      onKeyDown={(e) => {
        if (e.key === "F2") {
          e.preventDefault();
          renameNote();
        }
      }}
    >
      <header className="EditorHeader">
        <TitleInput
          ref={titleRef}
          className="EditorTitle"
          aria-label="Note title"
          placeholder={UNTITLED}
          value={note.name}
          autoFocus={focusTitle}
          selectOnFocus={focusTitle}
          onCommit={(name) => onRename(note.id, name)}
          onEnd={(reason) => {
            if (reason !== "blur") textRef.current?.focus();
          }}
        />
        <button
          type="button"
          className="ghostButton"
          aria-label="Note actions"
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <MoreIcon />
        </button>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={renameNote}>
            <PencilIcon size={14} /> Rename
            <kbd className="menuShortcut">F2</kbd>
          </MenuItem>
          <MenuItem
            className="menuDanger"
            onClick={() => {
              setMenuAnchor(null);
              onDelete(note.id);
            }}
          >
            <TrashIcon size={14} /> Delete
          </MenuItem>
        </Menu>
      </header>
      <textarea
        ref={textRef}
        id="EditorTE"
        aria-label="Note text"
        placeholder="Start writing…"
        spellCheck={false}
        autoFocus={!focusTitle}
        onChange={(e) => setText(e.target.value)}
        // Save as soon as focus leaves the text, e.g. to rename or delete.
        onBlur={() => pendingSave.current?.()}
        defaultValue={note.data}
      ></textarea>
      {showStatusBar && (
        <StatusBar
          text={text}
          note={note}
          showWordCount={showWordCount}
          saveStatus={text !== savedText ? "saving" : saveStatus}
          onRetrySave={onRetrySave}
        />
      )}
    </div>
  );
}
