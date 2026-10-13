// Pure helpers for the notes data:
//   { notes: [{ id, name, data, createdAt?, updatedAt? }] }
// Timestamps are epoch milliseconds. Notes saved by older versions have none;
// they get `updatedAt` the first time they are edited or renamed, and
// `createdAt` stays unknown. The helpers never mutate their input, so React
// state updates stay predictable, and they return the same object when
// nothing changed so no needless save happens.

export const UNTITLED = "Untitled Note";

export function noteTitle(note) {
  return note.name.trim() || UNTITLED;
}

function nextId(notes) {
  return notes.reduce((max, note) => Math.max(max, note.id), -1) + 1;
}

export function addNote(state, now = Date.now()) {
  const id = nextId(state.notes);
  return {
    ...state,
    notes: [
      ...state.notes,
      { id, name: "Note " + id, data: "", createdAt: now, updatedAt: now },
    ],
  };
}

function updateNote(state, id, changes, now) {
  const note = findNote(state, id);
  if (!note || Object.keys(changes).every((key) => note[key] === changes[key])) {
    return state;
  }
  return {
    ...state,
    notes: state.notes.map((n) =>
      n.id === id ? { ...n, ...changes, updatedAt: now } : n
    ),
  };
}

export function setNoteData(state, id, data, now = Date.now()) {
  return updateNote(state, id, { data }, now);
}

// Empty or blank names fall back to "Untitled Note".
export function renameNote(state, id, name, now = Date.now()) {
  return updateNote(state, id, { name: name.trim() || UNTITLED }, now);
}

export function removeNote(state, id) {
  if (!findNote(state, id)) return state;
  return { ...state, notes: state.notes.filter((note) => note.id !== id) };
}

// Puts a removed note back where it was, untouched. It only gets a new id if
// another note has taken its id in the meantime.
export function restoreNote(state, note, index) {
  const restored = findNote(state, note.id)
    ? { ...note, id: nextId(state.notes) }
    : note;
  const notes = [...state.notes];
  notes.splice(Math.min(index, notes.length), 0, restored);
  return { ...state, notes };
}

export function findNote(state, id) {
  return state.notes.find((note) => note.id === id);
}

export const SORT_OPTIONS = [
  { value: "updated-desc", label: "Last edited — newest first", short: "Last edited" },
  { value: "updated-asc", label: "Last edited — oldest first", short: "Last edited" },
  { value: "title-asc", label: "Title — A to Z", short: "Title" },
  { value: "title-desc", label: "Title — Z to A", short: "Title" },
  { value: "created-desc", label: "Date created — newest first", short: "Created" },
  { value: "created-asc", label: "Date created — oldest first", short: "Created" },
];

const titleCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const compareBy = {
  updated: (a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0),
  created: (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
  title: (a, b) => titleCollator.compare(noteTitle(a), noteTitle(b)),
};

// Returns a sorted copy; ties keep a stable order by id. Notes without a
// timestamp count as the oldest.
export function sortNotes(notes, sort) {
  const [key, direction] = sort.split("-");
  const compare = compareBy[key] ?? compareBy.updated;
  const sign = direction === "asc" ? 1 : -1;
  return [...notes].sort((a, b) => sign * compare(a, b) || a.id - b.id);
}
