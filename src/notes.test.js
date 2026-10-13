import { describe, expect, it } from "vitest";
import {
  addNote,
  findNote,
  noteTitle,
  removeNote,
  renameNote,
  restoreNote,
  setNoteData,
  sortNotes,
  SORT_OPTIONS,
} from "./notes";

const NOW = 1_700_000_000_000;

const state = {
  notes: [
    { id: 0, name: "Note 0", data: "first" },
    { id: 1, name: "Note 1", data: "second", createdAt: 10, updatedAt: 20 },
  ],
};

describe("addNote", () => {
  it("appends an empty note named after its id, with timestamps", () => {
    expect(addNote(state, NOW).notes).toEqual([
      ...state.notes,
      { id: 2, name: "Note 2", data: "", createdAt: NOW, updatedAt: NOW },
    ]);
  });

  it("starts at Note 0 when there are no notes", () => {
    expect(addNote({ notes: [] }, NOW).notes[0]).toMatchObject({ id: 0, name: "Note 0" });
  });

  it("never reuses the id of a remaining note after a deletion", () => {
    const afterDelete = removeNote(state, 0);
    expect(addNote(afterDelete, NOW).notes.map((n) => n.id)).toEqual([1, 2]);
  });

  it("keeps other top-level fields", () => {
    expect(addNote({ notes: [], extra: true }, NOW).extra).toBe(true);
  });

  it("does not modify the original state", () => {
    const before = structuredClone(state);
    addNote(state, NOW);
    expect(state).toEqual(before);
  });
});

describe("setNoteData", () => {
  it("replaces the text of the matching note only and stamps it", () => {
    expect(setNoteData(state, 1, "changed", NOW).notes).toEqual([
      state.notes[0],
      { ...state.notes[1], data: "changed", updatedAt: NOW },
    ]);
  });

  it("adds updatedAt to notes saved before timestamps existed", () => {
    expect(findNote(setNoteData(state, 0, "x", NOW), 0)).toEqual({
      id: 0, name: "Note 0", data: "x", updatedAt: NOW,
    });
  });

  it("returns the same state when the text is unchanged", () => {
    expect(setNoteData(state, 1, "second", NOW)).toBe(state);
  });

  it("allows emptying a note", () => {
    expect(findNote(setNoteData(state, 1, "", NOW), 1).data).toBe("");
  });

  it("ignores unknown ids", () => {
    expect(setNoteData(state, 99, "x", NOW)).toBe(state);
  });

  it("does not modify the original state", () => {
    const before = structuredClone(state);
    setNoteData(state, 0, "changed", NOW);
    expect(state).toEqual(before);
  });
});

describe("renameNote", () => {
  it("changes the name and stamps the note, but not its text", () => {
    expect(findNote(renameNote(state, 1, "Ideas", NOW), 1)).toEqual({
      ...state.notes[1], name: "Ideas", updatedAt: NOW,
    });
  });

  it("trims the name", () => {
    expect(findNote(renameNote(state, 1, "  Ideas  ", NOW), 1).name).toBe("Ideas");
  });

  it("falls back to Untitled Note for a blank name", () => {
    expect(findNote(renameNote(state, 1, "   ", NOW), 1).name).toBe("Untitled Note");
  });

  it("returns the same state when the name is unchanged", () => {
    expect(renameNote(state, 1, "Note 1", NOW)).toBe(state);
  });
});

describe("removeNote and restoreNote", () => {
  it("removes only the matching note", () => {
    expect(removeNote(state, 0).notes).toEqual([state.notes[1]]);
  });

  it("puts a removed note back in its place, untouched", () => {
    const removed = removeNote(state, 0);
    expect(restoreNote(removed, state.notes[0], 0)).toEqual(state);
  });

  it("gives a restored note a new id if its id was taken meanwhile", () => {
    const removed = removeNote(state, 1);
    const withNew = addNote(removed, NOW); // takes id 1
    const restored = restoreNote(withNew, state.notes[1], 1);
    expect(restored.notes.map((n) => n.id)).toEqual([0, 2, 1]);
    expect(restored.notes[1]).toEqual({ ...state.notes[1], id: 2 });
  });
});

describe("noteTitle", () => {
  it("uses the name, or Untitled Note when it is blank", () => {
    expect(noteTitle({ name: "Plans" })).toBe("Plans");
    expect(noteTitle({ name: " " })).toBe("Untitled Note");
  });
});

describe("sortNotes", () => {
  const notes = [
    { id: 0, name: "banana", data: "", createdAt: 100, updatedAt: 300 },
    { id: 1, name: "Apple", data: "", createdAt: 300, updatedAt: 100 },
    { id: 2, name: "note 10", data: "", createdAt: 200, updatedAt: 200 },
    { id: 3, name: "note 9", data: "" }, // saved before timestamps existed
  ];
  const ids = (sort) => sortNotes(notes, sort).map((n) => n.id);

  it.each([
    ["updated-desc", [0, 2, 1, 3]],
    ["updated-asc", [3, 1, 2, 0]],
    ["title-asc", [1, 0, 3, 2]],
    ["title-desc", [2, 3, 0, 1]],
    ["created-desc", [1, 2, 0, 3]],
    ["created-asc", [3, 0, 2, 1]],
  ])("sorts by %s", (sort, expected) => {
    expect(ids(sort)).toEqual(expected);
  });

  it("has an option for every supported order", () => {
    expect(SORT_OPTIONS.map((o) => o.value)).toHaveLength(6);
  });

  it("returns a copy and leaves the notes untouched", () => {
    const before = structuredClone(notes);
    expect(sortNotes(notes, "title-asc")).not.toBe(notes);
    expect(notes).toEqual(before);
  });

  it("keeps ties in id order", () => {
    const same = [{ id: 5, name: "a", data: "" }, { id: 2, name: "a", data: "" }];
    expect(sortNotes(same, "title-desc").map((n) => n.id)).toEqual([2, 5]);
  });
});
