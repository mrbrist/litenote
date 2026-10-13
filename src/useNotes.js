import { useCallback, useRef, useState } from "react";

// Holds the notes and saves every change. The latest notes also live in a ref,
// so updates always build on the newest data (never a stale render) and a
// change is handed to `api.notes.save` synchronously — which matters when the
// window is closing and there is no next render.
export function useNotes(api, initial) {
  const [notes, setNotes] = useState(initial);
  const latest = useRef(initial);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [saveError, setSaveError] = useState(null);

  const save = useCallback(
    (data) => {
      setPendingSaves((n) => n + 1);
      // Saves land in order, and each one writes every note, so the outcome
      // of the most recent save is the state of the file.
      api.notes.save(data).then(
        () => setSaveError(null),
        (error) => setSaveError(error ?? new Error("Unknown error"))
      ).finally(() => setPendingSaves((n) => n - 1));
    },
    [api]
  );

  // Applies `change(notes)`; returns the new notes.
  const update = useCallback(
    (change) => {
      const next = change(latest.current);
      if (next !== latest.current) {
        latest.current = next;
        setNotes(next);
        save(next);
      }
      return next;
    },
    [save]
  );

  const retrySave = useCallback(() => save(latest.current), [save]);

  return { notes, update, saving: pendingSaves > 0, saveError, retrySave };
}
