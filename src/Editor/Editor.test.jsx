import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Editor, { SAVE_DELAY_MS } from "./Editor";

const note = { id: 3, name: "Note 3", data: "hello", createdAt: 1, updatedAt: 2 };

const textArea = () => screen.getByLabelText("Note text");

function type(text) {
  fireEvent.change(textArea(), { target: { value: text } });
}

function renderEditor(props = {}) {
  const handlers = { onChange: vi.fn(), onRename: vi.fn(), onDelete: vi.fn() };
  const result = render(<Editor note={note} {...handlers} {...props} />);
  return { ...handlers, ...result };
}

describe("Editor", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the note's title and text", () => {
    renderEditor();
    expect(screen.getByLabelText("Note title")).toHaveValue("Note 3");
    expect(textArea()).toHaveValue("hello");
  });

  it("saves once typing has paused", () => {
    const { onChange } = renderEditor();

    type("hello world");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 1));
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("only saves the latest text while the user keeps typing", () => {
    const { onChange } = renderEditor();

    type("hello w");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS / 2));
    type("hello world");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("saves unsaved text immediately when closed", () => {
    const { onChange, unmount } = renderEditor();
    type("hello world");
    unmount();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("saves unsaved text immediately when the text loses focus", () => {
    const { onChange } = renderEditor();
    type("hello world");
    fireEvent.blur(textArea());
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("saves unsaved text when the window is closing", () => {
    const { onChange } = renderEditor();
    type("hello world");
    window.dispatchEvent(new Event("beforeunload"));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("does not save again on close once the text is saved", () => {
    const { onChange, unmount } = renderEditor();
    type("hello world");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    unmount();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("does not save before anything is typed", () => {
    const { onChange, unmount } = renderEditor();
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    unmount();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not save when the text is typed back to what it was", () => {
    const { onChange } = renderEditor();
    type("hello!");
    type("hello");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("saves a note that has been emptied", () => {
    const { onChange } = renderEditor();
    type("");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "");
  });

  describe("title", () => {
    const title = () => screen.getByLabelText("Note title");

    it("renames on Enter and moves to the text", () => {
      const { onRename } = renderEditor();
      act(() => title().focus());
      fireEvent.change(title(), { target: { value: "Plans" } });
      fireEvent.keyDown(title(), { key: "Enter" });
      expect(onRename).toHaveBeenCalledExactlyOnceWith(3, "Plans");
      expect(textArea()).toHaveFocus();
    });

    it("puts the old title back on Escape", () => {
      const { onRename } = renderEditor();
      act(() => title().focus());
      fireEvent.change(title(), { target: { value: "Plans" } });
      fireEvent.keyDown(title(), { key: "Escape" });
      expect(onRename).not.toHaveBeenCalled();
      expect(title()).toHaveValue("Note 3");
    });

    it("does not rename when the title is unchanged", () => {
      const { onRename } = renderEditor();
      act(() => title().focus());
      fireEvent.keyDown(title(), { key: "Enter" });
      expect(onRename).not.toHaveBeenCalled();
    });

    it("focuses the title with F2", () => {
      renderEditor();
      fireEvent.keyDown(textArea(), { key: "F2" });
      expect(title()).toHaveFocus();
    });
  });

  describe("status bar", () => {
    it("counts words and characters as the user types", () => {
      renderEditor();
      expect(screen.getByText("1 word")).toBeInTheDocument();
      expect(screen.getByText("5 characters")).toBeInTheDocument();

      type("hello there, world");
      expect(screen.getByText("3 words")).toBeInTheDocument();
      expect(screen.getByText("18 characters")).toBeInTheDocument();
    });

    it("handles an empty note", () => {
      renderEditor({ note: { ...note, data: "" } });
      expect(screen.getByText("0 words")).toBeInTheDocument();
      expect(screen.getByText("0 characters")).toBeInTheDocument();
      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });

    it("shows when the note was created and edited", () => {
      renderEditor({ note: { ...note, createdAt: Date.now(), updatedAt: Date.now() } });
      expect(screen.getByText("Created just now")).toBeInTheDocument();
      expect(screen.getByText("Edited just now")).toBeInTheDocument();
    });

    it("leaves out unknown timestamps", () => {
      renderEditor({ note: { id: 3, name: "Old", data: "" } });
      expect(screen.queryByText(/Created|Edited/)).not.toBeInTheDocument();
    });

    it("shows unsaved text as saving", () => {
      renderEditor();
      expect(screen.getByText("Saved")).toBeInTheDocument();
      type("hello!");
      expect(screen.getByText("Saving…")).toBeInTheDocument();
    });

    it("offers a retry when saving failed", () => {
      const onRetrySave = vi.fn();
      renderEditor({ saveStatus: "error", onRetrySave });
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(onRetrySave).toHaveBeenCalledOnce();
    });

    it("can hide the word count or the whole bar", () => {
      const { rerender, onChange, onRename, onDelete } = renderEditor({ showWordCount: false });
      expect(screen.queryByText("1 word")).not.toBeInTheDocument();
      expect(screen.getByText("Saved")).toBeInTheDocument();

      rerender(
        <Editor note={note} onChange={onChange} onRename={onRename} onDelete={onDelete} showStatusBar={false} />
      );
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    });
  });
});
