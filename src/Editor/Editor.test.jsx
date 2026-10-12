import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Editor, { SAVE_DELAY_MS } from "./Editor";

const note = { id: 3, name: "Note 3", data: "hello" };

function type(text) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
}

describe("Editor", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the note's text", () => {
    render(<Editor note={note} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });

  it("saves once typing has paused", () => {
    const onChange = vi.fn();
    render(<Editor note={note} onChange={onChange} />);

    type("hello world");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 1));
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("only saves the latest text while the user keeps typing", () => {
    const onChange = vi.fn();
    render(<Editor note={note} onChange={onChange} />);

    type("hello w");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS / 2));
    type("hello world");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("saves unsaved text immediately when closed", () => {
    const onChange = vi.fn();
    const { unmount } = render(<Editor note={note} onChange={onChange} />);
    type("hello world");
    unmount();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });

  it("does not save again on close once the text is saved", () => {
    const onChange = vi.fn();
    const { unmount } = render(<Editor note={note} onChange={onChange} />);
    type("hello world");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    unmount();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("does not save before anything is typed", () => {
    const onChange = vi.fn();
    render(<Editor note={note} onChange={onChange} />);
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(onChange).not.toHaveBeenCalled();
  });

  // Current behaviour: clearing a note completely is never saved.
  it("does not save a note that has been emptied", () => {
    const onChange = vi.fn();
    render(<Editor note={note} onChange={onChange} />);
    type("hello world");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    type("");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3, "hello world");
  });
});
