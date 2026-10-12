import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { createFakeApi } from "../test/fakeApi";

const NOTES = [
  { id: 0, name: "Note 0", data: "first" },
  { id: 1, name: "Note 1", data: "second" },
];

function renderApp(notes = NOTES, platform) {
  const api = createFakeApi(notes, platform);
  const user = userEvent.setup();
  const { container } = render(<App api={api} />);
  return { api, user, container };
}

describe("App", () => {
  it("lists the saved notes", async () => {
    const { api } = renderApp();
    expect(await screen.findByText("Note 0")).toBeInTheDocument();
    expect(screen.getByText("Note 1")).toBeInTheDocument();
    expect(api.notes.save).not.toHaveBeenCalled();
  });

  it("creates and saves a new note", async () => {
    const { api, user } = renderApp();
    await user.click(await screen.findByRole("button", { name: "New Note" }));

    expect(screen.getByText("Note 2")).toBeInTheDocument();
    expect(api.notes.save).toHaveBeenCalledExactlyOnceWith({
      notes: [...NOTES, { id: 2, name: "Note 2", data: "" }],
    });
  });

  it("opens a note with one click and shows its name in the titlebar", async () => {
    const { user } = renderApp();
    await user.click(await screen.findByText("Note 1"));

    expect(screen.getByRole("textbox")).toHaveValue("second");
    expect(screen.getByText("Note 1")).toHaveClass("titlebarTitle");
  });

  it("only shows the back button while a note is open", async () => {
    const { user } = renderApp();
    await screen.findByText("Note 0");
    expect(screen.queryByRole("button", { name: "Notes" })).not.toBeInTheDocument();
    expect(screen.getByText("litenote")).toBeInTheDocument();

    await user.click(screen.getByText("Note 0"));
    await user.click(screen.getByRole("button", { name: "Notes" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Note 1")).toBeInTheDocument();
    expect(screen.getByText("litenote")).toBeInTheDocument();
  });

  it("saves edits to the open note", async () => {
    const { api, user } = renderApp();
    await user.click(await screen.findByText("Note 1"));
    await user.type(screen.getByRole("textbox"), "!");

    await waitFor(() =>
      expect(api.notes.save).toHaveBeenCalledWith({
        notes: [NOTES[0], { ...NOTES[1], data: "second!" }],
      })
    );
  });

  it("saves the last edit straight away when going back to the list", async () => {
    const { api, user } = renderApp();
    await user.click(await screen.findByText("Note 1"));
    await user.type(screen.getByRole("textbox"), "!");
    await user.click(screen.getByRole("button", { name: "Notes" }));

    expect(api.notes.save).toHaveBeenCalledExactlyOnceWith({
      notes: [NOTES[0], { ...NOTES[1], data: "second!" }],
    });
  });

  it.each(["darwin", "win32", "linux"])(
    "lays out the titlebar for %s window controls",
    async (platform) => {
      const { container } = renderApp(NOTES, platform);
      await screen.findByText("Note 0");
      expect(container.querySelector(".Titlebar")).toHaveClass(`Titlebar--${platform}`);
    }
  );
});
