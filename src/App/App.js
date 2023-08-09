// import components
import React from 'react'
import { useEffect, useState } from "react";
import "./style.css";

// import custom modules
import Titlebar from "../Titlebar/Titlebar";
import EventList from "../EventList/EventList";
import Editor from "../Editor/Editor";

const fs = window.require("fs");
const remote = window.require("electron").remote;
const win = remote.getCurrentWindow();

function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => value + 1); // update state to force render
  // A function that increment 👆🏻 the previous state like here 
  // is better than directly setting `setValue(value + 1)`
}

// start react class
export default function App() {
  const forceUpdate = useForceUpdate();

  const [notes, setNotes] = useState();
  const [selectedNote, setSelectedNote] = useState(-1);
  const [list, setList] = useState(true);
  const [editor, setEditor] = useState(true);

  useEffect(() => {
    const data = fs.readFileSync("src/App/notes.json", "utf8");
    const notes_parse = JSON.parse(data);

    setNotes(notes_parse)
  }, []);

  // Window Utils
  function titlebar_close() {
    win.close();
  }
  function titlebar_min() {
    win.minimize();
  }
  function titlebar_maxrestore() {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }

  // Note Utils
  function switch_window() {
    if (list) {
      if (selectedNote !== -1) {
        setEditor(true);
        setList(false);
      }
    } else {
      setEditor(false);
      setList(true);
    }
  }
  function onSelectNote(note) {
    setSelectedNote(note);
    switch_window();
  }

  function updateNote(id, data) {
    let notesClone = notes;
    notesClone.notes[id].data = data;
    setNotes(notesClone);
    fs.writeFileSync("src/App/notes.json", JSON.stringify(notes));
  }

  function newNote() {
    let notesClone = notes;
    const newNoteJSON = { "id": notesClone.notes.length, "name": "Note " + notesClone.notes.length, "data": "" }
    notesClone.notes.push(newNoteJSON)
    setNotes(notesClone);
    forceUpdate()
    fs.writeFileSync("src/App/notes.json", JSON.stringify(notes));
  }

  // begin react render
  return (
    <div className="App">
      <Titlebar
        close={titlebar_close}
        min={titlebar_min}
        maxrestore={titlebar_maxrestore}
        switch_window={switch_window}
      />
      <div id="AppContent">
        <div>
          {notes ? (
            list ? (
              <EventList
                setSelectedNote={onSelectNote}
                data={notes}
                newNote={newNote}
              />
            ) : (
              <Editor note={selectedNote} data={notes} updateNote={updateNote} />
            )) : null}
        </div>
      </div>
    </div>
  );
}