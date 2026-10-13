import { useState } from "react";
import Dialog from "@mui/material/Dialog";

import { noteTitle } from "../notes";

// Asks before deleting `note`; closed when `note` is null.
export default function ConfirmDelete({ note, onCancel, onConfirm }) {
  // Keep showing the title while the dialog animates closed.
  const [shown, setShown] = useState(note);
  if (note && note !== shown) setShown(note);

  return (
    <Dialog
      open={Boolean(note)}
      onClose={onCancel}
      aria-labelledby="ConfirmDeleteTitle"
      aria-describedby="ConfirmDeleteText"
      slotProps={{ paper: { className: "ConfirmDialog" } }}
    >
      <h2 id="ConfirmDeleteTitle">Delete this note?</h2>
      <p id="ConfirmDeleteText">
        <strong>{shown ? noteTitle(shown) : ""}</strong> will be deleted. You can undo this
        for a few seconds afterwards.
      </p>
      <div className="ConfirmDialog-actions">
        <button type="button" className="ghostButton" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button type="button" className="dangerButton" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </Dialog>
  );
}
