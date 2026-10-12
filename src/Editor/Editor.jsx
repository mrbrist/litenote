import { useEffect, useRef, useState } from "react";
import "./style.css";

export const SAVE_DELAY_MS = 500;

export default function Editor({ note, onChange }) {
  const [data, setData] = useState("");
  const pendingSave = useRef(null);

  // Save once typing has paused. Nothing is saved until the note has been
  // edited, and an emptied note is not saved.
  useEffect(() => {
    pendingSave.current = null;
    if (data === "") return;
    const save = () => {
      pendingSave.current = null;
      onChange(note.id, data);
    };
    pendingSave.current = save;
    const timeout = setTimeout(save, SAVE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [data, note.id, onChange]);

  // Don't lose the last few keystrokes when going back to the list.
  useEffect(() => () => pendingSave.current?.(), []);

  return (
    <div className="Editor">
      <textarea
        id="EditorTE"
        autoFocus
        onChange={(e) => setData(e.target.value)}
        defaultValue={note.data}
      ></textarea>
    </div>
  );
}
