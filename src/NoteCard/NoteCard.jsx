import { memo, useMemo } from "react";
import "./style.css";

import TitleInput from "../TitleInput/TitleInput";
import { MoreIcon } from "../icons";
import { noteTitle, UNTITLED } from "../notes";
import { countWords, formatRelativeTime, notePreview, pluralize } from "../text";

// One note in the list. Memoised: while typing, only the edited note's card
// re-renders.
function NoteCard({
  note,
  active,
  renaming,
  showWordCount,
  now,
  onOpen,
  onMenu,
  onRename,
  onRenameEnd,
}) {
  const title = noteTitle(note);
  const preview = useMemo(() => notePreview(note.data), [note.data]);
  const words = useMemo(
    () => (showWordCount ? countWords(note.data) : 0),
    [note.data, showWordCount]
  );
  const edited = formatRelativeTime(note.updatedAt, now);

  const details = (
    <>
      <span className={`NoteCard-preview${preview ? "" : " NoteCard-preview--empty"}`}>
        {preview || "No content"}
      </span>
      {(edited || showWordCount) && (
        <span className="NoteCard-meta">
          {edited && <span>{edited}</span>}
          {showWordCount && <span>{pluralize(words, "word")}</span>}
        </span>
      )}
    </>
  );

  return (
    <li className={`NoteCard${active ? " NoteCard--active" : ""}`}>
      {renaming ? (
        <div className="NoteCard-main">
          <TitleInput
            className="NoteCard-titleInput"
            aria-label="New title"
            placeholder={UNTITLED}
            value={note.name}
            autoFocus
            selectOnFocus
            onCommit={(name) => onRename(note.id, name)}
            onEnd={(reason) => onRenameEnd(note.id, reason)}
          />
          {details}
        </div>
      ) : (
        <button
          type="button"
          className="NoteCard-main"
          data-note-id={note.id}
          aria-current={active ? "true" : undefined}
          onClick={() => onOpen(note.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onMenu(note.id, e.currentTarget, e.clientX || e.clientY ? e : null);
          }}
        >
          <span className="NoteCard-title">{title}</span>
          {details}
        </button>
      )}
      {!renaming && (
        <button
          type="button"
          className="ghostButton NoteCard-more"
          aria-label={`Actions for ${title}`}
          aria-haspopup="menu"
          tabIndex={-1}
          onClick={(e) => onMenu(note.id, e.currentTarget)}
        >
          <MoreIcon />
        </button>
      )}
    </li>
  );
}

export default memo(NoteCard);
