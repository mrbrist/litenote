import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { createFakeApi } from "../test/fakeApi";

const NOTES = [
  { id: 0, name: "Note 0", data: "first", createdAt: 1000, updatedAt: 5000 },
  { id: 1, name: "Note 1", data: "second note", createdAt: 2000, updatedAt: 9000 },
];

function renderApp({ notes = NOTES, platform, settings } = {}) {
  const api = createFakeApi(notes, platform, settings);
  const user = userEvent.setup();
  const { container } = render(<App api={api} />);
  return { api, user, container };
}

const lastSaved = (api) => api.notes.save.mock.lastCall[0];
const noteList = () => screen.getByRole("list", { name: "Notes" });
const listTitles = () =>
  within(noteList())
    .getAllByRole("listitem")
    .map((item) => item.querySelector(".NoteCard-title, .NoteCard-titleInput")?.textContent);
const noteText = () => screen.getByLabelText("Note text");
const waitForDialogToClose = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

async function openNote(user, name) {
  await user.click(await within(await screen.findByRole("list", { name: "Notes" })).findByText(name));
}

afterEach(() => {
  vi.restoreAllMocks();
  delete window.matchMedia;
});

describe("App", () => {
  it("lists the saved notes, newest edit first, without saving anything", async () => {
    const { api } = renderApp();
    expect(await screen.findByText("Note 0")).toBeInTheDocument();
    expect(listTitles()).toEqual(["Note 1", "Note 0"]);
    expect(api.notes.save).not.toHaveBeenCalled();
  });

  it("shows a preview, the edit time and word count for each note", async () => {
    renderApp();
    const card = (await screen.findByText("Note 1")).closest("li");
    expect(within(card).getByText("second note")).toBeInTheDocument();
    expect(within(card).getByText("2 words")).toBeInTheDocument();
  });

  it("loads notes saved before timestamps existed", async () => {
    const { user, api } = renderApp({ notes: [{ id: 0, name: "Old", data: "kept" }] });
    await openNote(user, "Old");
    expect(noteText()).toHaveValue("kept");
    expect(api.notes.save).not.toHaveBeenCalled();
  });

  it("creates, opens and saves a new note with timestamps", async () => {
    const { api, user } = renderApp();
    await user.click(await screen.findByRole("button", { name: "New Note" }));

    expect(lastSaved(api).notes).toEqual([
      ...NOTES,
      { id: 2, name: "Note 2", data: "", createdAt: expect.any(Number), updatedAt: expect.any(Number) },
    ]);
    // The new note is open with its title selected, ready to be named.
    expect(screen.getByLabelText("Note title")).toHaveFocus();
    expect(screen.getByLabelText("Note title")).toHaveValue("Note 2");
  });

  it("creates a note with the keyboard shortcut", async () => {
    const { api, user } = renderApp({ platform: "win32" });
    await screen.findByText("Note 0");
    await user.keyboard("{Control>}n{/Control}");
    expect(lastSaved(api).notes).toHaveLength(3);
  });

  it("opens a note with one click without changing it", async () => {
    const { api, user, container } = renderApp();
    await openNote(user, "Note 1");

    expect(noteText()).toHaveValue("second note");
    expect(container.querySelector(".titlebarTitle")).toHaveTextContent("Note 1");
    const card = within(noteList()).getByText("Note 1").closest("button");
    expect(card).toHaveAttribute("aria-current", "true");
    expect(api.notes.save).not.toHaveBeenCalled();
  });

  it("saves edits and stamps only the edited note", async () => {
    const { api, user } = renderApp();
    await openNote(user, "Note 0");
    await user.type(noteText(), "!");

    await waitFor(() => expect(api.notes.save).toHaveBeenCalled());
    const [first, second] = lastSaved(api).notes;
    expect(first).toEqual({ ...NOTES[0], data: "first!", updatedAt: expect.any(Number) });
    expect(first.updatedAt).toBeGreaterThan(NOTES[0].updatedAt);
    expect(second).toBe(NOTES[1]);
  });

  it("saves the last edit straight away when switching notes", async () => {
    const { api, user } = renderApp();
    await openNote(user, "Note 1");
    await user.type(noteText(), "!");
    await openNote(user, "Note 0");

    expect(api.notes.save).toHaveBeenCalledOnce();
    expect(lastSaved(api).notes[1].data).toBe("second note!");
    expect(noteText()).toHaveValue("first");
  });

  describe("renaming", () => {
    it("renames from the note's menu without touching its text", async () => {
      const { api, user } = renderApp();
      await user.click(await screen.findByRole("button", { name: "Actions for Note 0" }));
      await user.click(screen.getByRole("menuitem", { name: /Rename/ }));
      const input = screen.getByLabelText("New title");
      expect(input).toHaveFocus();
      await user.clear(input);
      await user.type(input, "Shopping{Enter}");

      expect(listTitles()).toContain("Shopping");
      expect(lastSaved(api).notes[0]).toEqual({
        ...NOTES[0], name: "Shopping", updatedAt: expect.any(Number),
      });
    });

    it("keeps the old title when renaming is cancelled", async () => {
      const { api, user } = renderApp();
      await user.click(await screen.findByRole("button", { name: "Actions for Note 0" }));
      await user.click(screen.getByRole("menuitem", { name: /Rename/ }));
      await user.type(screen.getByLabelText("New title"), "xyz{Escape}");

      expect(listTitles()).toEqual(["Note 1", "Note 0"]);
      expect(api.notes.save).not.toHaveBeenCalled();
    });

    it("renames the open note from its title, updating the list and titlebar", async () => {
      const { user, container } = renderApp();
      await openNote(user, "Note 0");
      const title = screen.getByLabelText("Note title");
      await user.clear(title);
      await user.type(title, "Ideas{Enter}");

      expect(within(noteList()).getByText("Ideas")).toBeInTheDocument();
      expect(container.querySelector(".titlebarTitle")).toHaveTextContent("Ideas");
    });

    it("names a note Untitled Note when its title is cleared", async () => {
      const { api, user } = renderApp();
      await openNote(user, "Note 0");
      await user.clear(screen.getByLabelText("Note title"));
      await user.keyboard("{Enter}");

      expect(lastSaved(api).notes[0].name).toBe("Untitled Note");
      expect(screen.getByLabelText("Note title")).toHaveValue("Untitled Note");
    });
  });

  describe("deleting", () => {
    async function deleteFromMenu(user, name) {
      await user.click(await screen.findByRole("button", { name: `Actions for ${name}` }));
      await user.click(screen.getByRole("menuitem", { name: /Delete/ }));
    }

    it("asks first, and cancelling keeps the note", async () => {
      const { api, user } = renderApp();
      await deleteFromMenu(user, "Note 0");
      const dialog = screen.getByRole("dialog", { name: "Delete this note?" });
      expect(within(dialog).getByText("Note 0")).toBeInTheDocument();

      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      await waitForDialogToClose();
      expect(listTitles()).toEqual(["Note 1", "Note 0"]);
      expect(api.notes.save).not.toHaveBeenCalled();
    });

    it("deletes only the chosen note once confirmed, and can undo", async () => {
      const { api, user } = renderApp();
      await deleteFromMenu(user, "Note 0");
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await waitForDialogToClose();

      expect(listTitles()).toEqual(["Note 1"]);
      expect(lastSaved(api)).toEqual({ notes: [NOTES[1]] });

      await user.click(screen.getByRole("button", { name: "Undo" }));
      expect(listTitles()).toEqual(["Note 1", "Note 0"]);
      expect(lastSaved(api)).toEqual({ notes: NOTES });
    });

    it("skips the question when confirmation is turned off", async () => {
      const { api, user } = renderApp({ settings: { confirmDelete: false } });
      await deleteFromMenu(user, "Note 1");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(lastSaved(api)).toEqual({ notes: [NOTES[0]] });
    });

    it("opens the next note when the open note is deleted", async () => {
      const { user } = renderApp({ settings: { confirmDelete: false } });
      await openNote(user, "Note 1");
      await user.click(screen.getByRole("button", { name: "Note actions" }));
      await user.click(screen.getByRole("menuitem", { name: /Delete/ }));

      expect(noteText()).toHaveValue("first");
    });

    it("shows the empty state after deleting the last note", async () => {
      const { user } = renderApp({ notes: [NOTES[0]], settings: { confirmDelete: false } });
      await openNote(user, "Note 0");
      await user.click(screen.getByRole("button", { name: "Note actions" }));
      await user.click(screen.getByRole("menuitem", { name: /Delete/ }));

      expect(screen.queryByLabelText("Note text")).not.toBeInTheDocument();
      expect(screen.getByText("You don't have any notes yet.")).toBeInTheDocument();
      expect(screen.getByText("No notes yet.")).toBeInTheDocument();
    });

    it("keeps the deleted note's last keystrokes for undo", async () => {
      const { api, user } = renderApp({ settings: { confirmDelete: false } });
      await openNote(user, "Note 1");
      await user.type(noteText(), "!");
      await user.click(screen.getByRole("button", { name: "Note actions" }));
      await user.click(screen.getByRole("menuitem", { name: /Delete/ }));
      await user.click(screen.getByRole("button", { name: "Undo" }));

      expect(lastSaved(api).notes[1].data).toBe("second note!");
    });
  });

  describe("sorting", () => {
    it("changes the order, remembers it, and leaves the notes alone", async () => {
      const { api, user } = renderApp();
      await user.click(
        await screen.findByRole("button", { name: "Sort notes: Last edited — newest first" })
      );
      await user.click(screen.getByRole("menuitemradio", { name: /Last edited — oldest first/ }));

      expect(listTitles()).toEqual(["Note 0", "Note 1"]);
      expect(api.settings.save).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "updated-asc" })
      );
      expect(api.notes.save).not.toHaveBeenCalled();
    });

    it("uses the saved sort order", async () => {
      renderApp({ settings: { sort: "created-asc" } });
      await screen.findByText("Note 0");
      expect(listTitles()).toEqual(["Note 0", "Note 1"]);
      expect(screen.getByRole("button", { name: /Date created — oldest first/ })).toBeInTheDocument();
    });
  });

  describe("settings", () => {
    it("applies the saved typography", async () => {
      renderApp({ settings: { font: "ibm-plex-mono", fontSize: 18 } });
      await screen.findByText("Note 0");
      const style = document.documentElement.style;
      expect(style.getPropertyValue("--font-family")).toMatch(/^"IBM Plex Mono"/);
      expect(style.getPropertyValue("--editor-font-size")).toBe("18px");
    });

    it("falls back to defaults when settings can't be read", async () => {
      const api = createFakeApi(NOTES);
      api.settings.load.mockRejectedValue(new SyntaxError("bad json"));
      render(<App api={api} />);
      await screen.findByText("Note 0");
      expect(document.documentElement.style.getPropertyValue("--font-family")).toMatch(
        /^"JetBrains Mono"/
      );
    });

    it("changes the font straight away and saves it", async () => {
      const { api, user } = renderApp();
      await user.click(await screen.findByRole("button", { name: "Settings" }));
      await user.click(screen.getByRole("radio", { name: "Fira Code" }));

      expect(document.documentElement.style.getPropertyValue("--font-family")).toMatch(/^"Fira Code"/);
      expect(api.settings.save).toHaveBeenLastCalledWith(expect.objectContaining({ font: "fira-code" }));
      expect(api.notes.save).not.toHaveBeenCalled();
    });

    it("changes the editor font size and can reset appearance", async () => {
      const { api, user } = renderApp();
      await user.click(await screen.findByRole("button", { name: "Settings" }));
      await user.click(screen.getByRole("button", { name: "Increase font size" }));
      expect(screen.getByText("16px")).toBeInTheDocument();
      expect(document.documentElement.style.getPropertyValue("--editor-font-size")).toBe("16px");

      await user.click(screen.getByRole("button", { name: "Reset appearance" }));
      expect(screen.getByText("15px")).toBeInTheDocument();
      expect(api.settings.save).toHaveBeenLastCalledWith(expect.objectContaining({ fontSize: 15 }));
    });

    it("disables ligatures for a font without them", async () => {
      const { user } = renderApp({ settings: { font: "ibm-plex-mono" } });
      await user.click(await screen.findByRole("button", { name: "Settings" }));
      expect(screen.getByLabelText("Font ligatures")).toBeDisabled();
    });

    it("hides the status bar", async () => {
      const { user } = renderApp();
      await openNote(user, "Note 1");
      expect(screen.getByText("2 words", { selector: ".StatusBar span" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Settings" }));
      await user.click(screen.getByLabelText("Status bar"));
      expect(document.querySelector(".StatusBar")).not.toBeInTheDocument();
    });
  });

  describe("problems", () => {
    it("shows an error and never saves when the notes can't be read", async () => {
      const api = createFakeApi();
      api.notes.load.mockRejectedValue(new SyntaxError("Unexpected token"));
      render(<App api={api} />);

      expect(await screen.findByRole("alert")).toHaveTextContent("Unexpected token");
      expect(screen.queryByRole("button", { name: "New Note" })).not.toBeInTheDocument();
      expect(api.notes.save).not.toHaveBeenCalled();
    });

    it("reports a failed save and retries it", async () => {
      const { api, user } = renderApp();
      api.notes.save.mockRejectedValueOnce(new Error("disk full"));
      await user.click(await screen.findByRole("button", { name: "New Note" }));

      expect(await screen.findByText(/Couldn't save your notes \(disk full\)/)).toBeInTheDocument();
      expect(screen.getByText("Not saved")).toBeInTheDocument();

      await user.click(screen.getAllByRole("button", { name: "Retry" })[0]);
      await waitFor(() => expect(screen.queryByText(/Couldn't save/)).not.toBeInTheDocument());
      expect(api.notes.save).toHaveBeenCalledTimes(2);
      expect(lastSaved(api).notes).toHaveLength(3);
    });
  });

  describe("narrow windows", () => {
    function mockNarrow() {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));
    }

    it("shows the list or the note, with a back button", async () => {
      mockNarrow();
      const { api, user } = renderApp();
      await openNote(user, "Note 1");
      expect(screen.queryByRole("list", { name: "Notes" })).not.toBeInTheDocument();

      await user.type(noteText(), "!");
      await user.click(screen.getByRole("button", { name: "Notes" }));

      expect(screen.queryByLabelText("Note text")).not.toBeInTheDocument();
      expect(listTitles()[0]).toBe("Note 1");
      expect(api.notes.save).toHaveBeenCalledOnce();
      expect(lastSaved(api).notes[1].data).toBe("second note!");
    });
  });

  it.each(["darwin", "win32", "linux"])(
    "lays out the titlebar for %s window controls",
    async (platform) => {
      const { container } = renderApp({ platform });
      await screen.findByText("Note 0");
      expect(container.querySelector(".Titlebar")).toHaveClass(`Titlebar--${platform}`);
    }
  );

  it("refreshes relative times", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const now = Date.now();
      renderApp({ notes: [{ ...NOTES[0], updatedAt: now }] });
      expect(await screen.findByText("Just now")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(3 * 60_000));
      expect(screen.getByText("3 minutes ago")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
