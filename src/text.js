// Text statistics and date formatting shown in the note list and status bar.

const wordSegmenter = new Intl.Segmenter(undefined, { granularity: "word" });
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// Counts words the way the platform's word breaker sees them, so punctuation
// and whitespace never count, "don't" is one word, and languages written
// without spaces (Chinese, Japanese, …) still get a sensible count.
export function countWords(text) {
  let count = 0;
  for (const segment of wordSegmenter.segment(text)) {
    if (segment.isWordLike) count++;
  }
  return count;
}

// Counts user-perceived characters, so an emoji or an accented letter made of
// several code points counts once. Line breaks and spaces count.
export function countCharacters(text) {
  let count = 0;
  // eslint-disable-next-line no-unused-vars
  for (const _ of graphemeSegmenter.segment(text)) count++;
  return count;
}

export const WORDS_PER_MINUTE = 200;

export function readingTime(words) {
  if (words === 0) return null;
  const minutes = Math.round(words / WORDS_PER_MINUTE);
  return minutes < 1 ? "<1 min read" : `${minutes} min read`;
}

export function pluralize(count, word) {
  return `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;
}

// The start of the note on one line, for the note list.
export function notePreview(text, length = 140) {
  return text.slice(0, length * 2).replace(/\s+/g, " ").trim().slice(0, length);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

export function formatDateTime(time) {
  return new Date(time).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// "Just now", "5 minutes ago", "3 hours ago", "Yesterday 14:02", then a
// localized date. Returns null when the time is unknown.
export function formatRelativeTime(time, now = Date.now()) {
  if (time == null) return null;
  const elapsed = now - time;
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return pluralize(Math.floor(elapsed / MINUTE), "minute") + " ago";

  const date = new Date(time);
  const today = new Date(now);
  const clock = date.toLocaleTimeString(undefined, { timeStyle: "short" });
  if (isSameDay(date, today)) {
    return elapsed < 6 * HOUR
      ? pluralize(Math.floor(elapsed / HOUR), "hour") + " ago"
      : `Today ${clock}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Yesterday ${clock}`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}
