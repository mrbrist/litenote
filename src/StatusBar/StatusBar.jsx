import { memo, useDeferredValue, useMemo } from "react";
import "./style.css";

import { useNow } from "../useNow";
import {
  countCharacters,
  countWords,
  formatDateTime,
  formatRelativeTime,
  pluralize,
  readingTime,
} from "../text";

const SAVE_LABELS = {
  saved: "Saved",
  saving: "Saving…",
  error: "Not saved",
};

// "Just now" reads as "Edited just now"; dates keep their capitals.
const inSentence = (time) =>
  time.replace(/^(Just|Today|Yesterday)\b/, (word) => word.toLowerCase());

// Statistics for the open note. Counting is deferred so long notes never
// slow down typing.
function StatusBar({ text, note, showWordCount, saveStatus, onRetrySave }) {
  const now = useNow();
  const deferredText = useDeferredValue(text);
  const stats = useMemo(
    () => ({ words: countWords(deferredText), characters: countCharacters(deferredText) }),
    [deferredText]
  );
  const edited = formatRelativeTime(note.updatedAt, now);
  const reading = readingTime(stats.words);

  return (
    <footer className="StatusBar" aria-label="Note details">
      {showWordCount && (
        <div className="StatusBar-group">
          <span>{pluralize(stats.words, "word")}</span>
          <span>{pluralize(stats.characters, "character")}</span>
          {reading && <span className="StatusBar-optional">{reading}</span>}
        </div>
      )}
      <div className="StatusBar-group StatusBar-end">
        {note.createdAt != null && (
          <span className="StatusBar-optional" title={formatDateTime(note.createdAt)}>
            Created {inSentence(formatRelativeTime(note.createdAt, now))}
          </span>
        )}
        {edited && (
          <span title={formatDateTime(note.updatedAt)}>
            Edited {inSentence(edited)}
          </span>
        )}
        {/* Not a live region: it changes on every pause in typing. Save
            failures are announced by the app's error notice instead. */}
        <span className={`StatusBar-save StatusBar-save--${saveStatus}`}>
          <span className="StatusBar-dot" aria-hidden="true" />
          {SAVE_LABELS[saveStatus]}
          {saveStatus === "error" && onRetrySave && (
            <button type="button" className="StatusBar-retry" onClick={onRetrySave}>
              Retry
            </button>
          )}
        </span>
      </div>
    </footer>
  );
}

export default memo(StatusBar);
