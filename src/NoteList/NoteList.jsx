import { useCallback, useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import "./style.css";

import NoteCard from "../NoteCard/NoteCard";
import { PencilIcon, TrashIcon } from "../icons";
import { useNow } from "../useNow";

function focusCard(list, from, step) {
  const cards = [...list.querySelectorAll("button.NoteCard-main")];
  if (cards.length === 0) return;
  const index = cards.indexOf(from);
  const next =
    step === Infinity ? cards.length - 1
    : step === -Infinity ? 0
    : Math.max(0, Math.min(cards.length - 1, index + step));
  cards[next].focus();
}

const NAV_KEYS = { ArrowDown: 1, ArrowUp: -1, Home: -Infinity, End: Infinity };

// The notes, in the order given. Each note has a menu (the "…" button, a
// right click or the context-menu key) with Rename and Delete; with a note
// focused, F2 renames it and Delete deletes it.
export default function NoteList({
  notes,
  openId,
  renamingId,
  showWordCount,
  onOpen,
  onStartRename,
  onRename,
  onRenameEnd,
  onDelete,
}) {
  const now = useNow();
  const [menu, setMenu] = useState(null);
  const onMenu = useCallback(
    (id, anchorEl, pointer) =>
      setMenu({
        id,
        anchorEl,
        position: pointer ? { top: pointer.clientY, left: pointer.clientX } : null,
      }),
    []
  );

  function handleKeyDown(e) {
    const card = e.target.closest?.("button.NoteCard-main");
    if (!card) return;
    const id = Number(card.dataset.noteId);
    if (e.key in NAV_KEYS) {
      e.preventDefault();
      focusCard(e.currentTarget, card, NAV_KEYS[e.key]);
    } else if (e.key === "F2") {
      e.preventDefault();
      onStartRename(id);
    } else if (e.key === "Delete") {
      e.preventDefault();
      onDelete(id);
    }
  }

  function menuAction(action) {
    const id = menu.id;
    setMenu(null);
    action(id);
  }

  return (
    <>
      <ul className="NoteList" aria-label="Notes" onKeyDown={handleKeyDown}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            active={note.id === openId}
            renaming={note.id === renamingId}
            showWordCount={showWordCount}
            now={now}
            onOpen={onOpen}
            onMenu={onMenu}
            onRename={onRename}
            onRenameEnd={onRenameEnd}
          />
        ))}
      </ul>
      <Menu
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorEl={menu?.anchorEl}
        anchorReference={menu?.position ? "anchorPosition" : "anchorEl"}
        anchorPosition={menu?.position ?? undefined}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: menu?.position ? "left" : "right" }}
      >
        <MenuItem onClick={() => menuAction(onStartRename)}>
          <PencilIcon size={14} /> Rename
          <kbd className="menuShortcut">F2</kbd>
        </MenuItem>
        <MenuItem className="menuDanger" onClick={() => menuAction(onDelete)}>
          <TrashIcon size={14} /> Delete
          <kbd className="menuShortcut">Del</kbd>
        </MenuItem>
      </Menu>
    </>
  );
}
