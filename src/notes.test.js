import { describe, expect, it } from "vitest";
import { addNote, findNote, setNoteData } from "./notes";

const state = {
  notes: [
    { id: 0, name: "Note 0", data: "first" },
    { id: 1, name: "Note 1", data: "second" },
  ],
};

describe("addNote", () => {
  it("appends an empty note named after its id", () => {
    expect(addNote(state).notes).toEqual([
      ...state.notes,
      { id: 2, name: "Note 2", data: "" },
    ]);
  });

  it("starts at Note 0 when there are no notes", () => {
    expect(addNote({ notes: [] })).toEqual({
      notes: [{ id: 0, name: "Note 0", data: "" }],
    });
  });

  it("does not modify the original state", () => {
    const before = structuredClone(state);
    addNote(state);
    expect(state).toEqual(before);
  });
});

describe("setNoteData", () => {
  it("replaces the text of the matching note only", () => {
    expect(setNoteData(state, 1, "changed").notes).toEqual([
      { id: 0, name: "Note 0", data: "first" },
      { id: 1, name: "Note 1", data: "changed" },
    ]);
  });

  it("does not modify the original state", () => {
    const before = structuredClone(state);
    setNoteData(state, 0, "changed");
    expect(state).toEqual(before);
  });
});

describe("findNote", () => {
  it("finds a note by id", () => {
    expect(findNote(state, 1)).toBe(state.notes[1]);
  });

  it("returns undefined for an unknown id", () => {
    expect(findNote(state, 99)).toBeUndefined();
  });
});
