import { useRef, useState } from "react";

// A text field for a note's title. Typing only changes a draft: Enter or
// leaving the field saves it, Escape throws it away and puts the old title
// back. `onEnd(reason)` reports how editing finished ("enter", "escape" or
// "blur") so the caller can decide where focus goes next.
export default function TitleInput({
  ref,
  value,
  onCommit,
  onEnd,
  selectOnFocus = false,
  ...props
}) {
  const [draft, setDraft] = useState(null);
  const endReason = useRef(null);

  function finish(input, reason) {
    endReason.current = reason;
    input.blur();
  }

  return (
    <input
      ref={ref}
      type="text"
      spellCheck={false}
      autoComplete="off"
      {...props}
      value={draft ?? value}
      onFocus={(e) => {
        endReason.current = null;
        setDraft(value);
        if (selectOnFocus) e.target.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const reason = endReason.current ?? "blur";
        if (reason !== "escape" && draft !== null && draft !== value) {
          onCommit(draft);
        }
        setDraft(null);
        onEnd?.(reason);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(e.currentTarget, "enter");
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish(e.currentTarget, "escape");
        }
      }}
    />
  );
}

