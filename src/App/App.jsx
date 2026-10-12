import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import "./style.css";

import Titlebar from "../Titlebar/Titlebar";
import NoteList from "../NoteList/NoteList";
import Editor from "../Editor/Editor";
import theme from "../theme";
import { addNote, findNote, setNoteData } from "../notes";

// `api` is window.litenote (see electron/preload.cjs). Tests pass a fake.
export default function App({ api }) {
  const [notes, setNotes] = useState();
  const [openNoteId, setOpenNoteId] = useState(null);
  const loadedNotes = useRef();

  useEffect(() => {
    api.notes.load().then((data) => {
      loadedNotes.current = data;
      setNotes(data);
    });
  }, [api]);

  // Persist every change made after the initial load.
  useEffect(() => {
    if (notes && notes !== loadedNotes.current) {
      api.notes.save(notes);
    }
  }, [api, notes]);

  const newNote = useCallback(() => setNotes(addNote), []);
  const updateNote = useCallback(
    (id, data) => setNotes((current) => setNoteData(current, id, data)),
    []
  );

  const openNote = notes && openNoteId !== null ? findNote(notes, openNoteId) : null;

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Titlebar
          platform={api.platform}
          title={openNote ? openNote.name : "litenote"}
          onBack={openNote ? () => setOpenNoteId(null) : undefined}
        />
        <div id="AppContent">
          {notes ? (
            openNote ? (
              <Editor note={openNote} onChange={updateNote} />
            ) : (
              <NoteList
                notes={notes.notes}
                onSelect={setOpenNoteId}
                onCreate={newNote}
              />
            )
          ) : null}
        </div>
      </div>
    </ThemeProvider>
  );
}
