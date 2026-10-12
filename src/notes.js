// Pure helpers for the notes data ({ notes: [{ id, name, data }] }). They
// never mutate their input, so React state updates stay predictable.

export function addNote(state) {
  const id = state.notes.length;
  return {
    ...state,
    notes: [...state.notes, { id, name: "Note " + id, data: "" }],
  };
}

export function setNoteData(state, id, data) {
  return {
    ...state,
    notes: state.notes.map((note) => (note.id === id ? { ...note, data } : note)),
  };
}

export function findNote(state, id) {
  return state.notes.find((note) => note.id === id);
}
