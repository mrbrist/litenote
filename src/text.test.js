import { describe, expect, it } from "vitest";
import {
  countCharacters,
  countWords,
  formatRelativeTime,
  notePreview,
  pluralize,
  readingTime,
} from "./text";

describe("countWords", () => {
  it.each([
    ["", 0],
    ["   \n\t ", 0],
    ["hello", 1],
    ["hello world", 2],
    ["  hello   world  ", 2],
    ["one\ntwo\n\nthree", 3],
    ["Hello, world! How's it going?", 5],
    ["--- ... !!!", 0],
    ["state-of-the-art", 4],
    ["café naïve résumé", 3],
    ["3.14 is pi", 3],
  ])("counts %j as %i words", (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });

  it("counts text written without spaces", () => {
    expect(countWords("我喜欢写笔记")).toBeGreaterThan(1);
  });
});

describe("countCharacters", () => {
  it("counts every character, including spaces and line breaks", () => {
    expect(countCharacters("")).toBe(0);
    expect(countCharacters("a b\nc")).toBe(5);
  });

  it("counts an emoji or combined character once", () => {
    expect(countCharacters("👍🏽")).toBe(1);
    expect(countCharacters("é")).toBe(1);
  });
});

describe("readingTime", () => {
  it("is empty for an empty note", () => {
    expect(readingTime(0)).toBeNull();
  });

  it("rounds to whole minutes", () => {
    expect(readingTime(50)).toBe("<1 min read");
    expect(readingTime(200)).toBe("1 min read");
    expect(readingTime(1000)).toBe("5 min read");
  });
});

describe("pluralize", () => {
  it("adds an s except for one", () => {
    expect(pluralize(1, "word")).toBe("1 word");
    expect(pluralize(0, "word")).toBe("0 words");
    expect(pluralize(2, "word")).toBe("2 words");
  });
});

describe("notePreview", () => {
  it("joins lines and trims", () => {
    expect(notePreview("  first line\n\n  second\tline ")).toBe("first line second line");
  });

  it("shortens long text", () => {
    expect(notePreview("x".repeat(500), 10)).toBe("x".repeat(10));
  });
});

describe("formatRelativeTime", () => {
  const now = new Date(2026, 5, 15, 18, 0).getTime();
  const ago = (ms) => formatRelativeTime(now - ms, now);
  const MIN = 60_000;

  it("is null when the time is unknown", () => {
    expect(formatRelativeTime(undefined, now)).toBeNull();
  });

  it("describes recent times", () => {
    expect(ago(10_000)).toBe("Just now");
    expect(ago(MIN)).toBe("1 minute ago");
    expect(ago(5 * MIN)).toBe("5 minutes ago");
    expect(ago(3 * 60 * MIN)).toBe("3 hours ago");
  });

  it("uses Today / Yesterday with the time for older edits", () => {
    expect(ago(10 * 60 * MIN)).toMatch(/^Today /);
    expect(ago(24 * 60 * MIN)).toMatch(/^Yesterday /);
  });

  it("uses a date beyond yesterday", () => {
    const text = ago(10 * 24 * 60 * MIN);
    expect(text).not.toMatch(/ago|Today|Yesterday/);
    expect(text).toMatch(/5/); // June 5th
  });
});
