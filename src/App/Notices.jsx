import { useEffect } from "react";

import { noteTitle } from "../notes";

export const UNDO_TIMEOUT_MS = 8000;

function errorMessage(error) {
  return error?.message ? ` (${error.message})` : "";
}

// Messages in the bottom corner: undo after a delete, and save failures. Save
// failures stay until a save succeeds, so they can't be missed.
export default function Notices({
  undo,
  onUndo,
  onDismissUndo,
  saveError,
  onRetrySave,
  settingsError,
  onDismissSettingsError,
}) {
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(onDismissUndo, UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [undo, onDismissUndo]);

  return (
    <div className="Notices">
      <div aria-live="polite">
        {undo && (
          <div className="Notice">
            <span className="Notice-text">
              Deleted <strong>{noteTitle(undo.note)}</strong>
            </span>
            <button type="button" className="Notice-action" onClick={onUndo}>
              Undo
            </button>
            <button
              type="button"
              className="ghostButton Notice-close"
              aria-label="Dismiss"
              onClick={onDismissUndo}
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div role="alert">
        {saveError && (
          <div className="Notice Notice--error">
            <span className="Notice-text">
              Couldn't save your notes{errorMessage(saveError)}. Your changes are kept
              while the app is open.
            </span>
            <button type="button" className="Notice-action" onClick={onRetrySave}>
              Retry
            </button>
          </div>
        )}
        {settingsError && (
          <div className="Notice Notice--error">
            <span className="Notice-text">
              Couldn't save settings{errorMessage(settingsError)}.
            </span>
            <button
              type="button"
              className="ghostButton Notice-close"
              aria-label="Dismiss"
              onClick={onDismissSettingsError}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
