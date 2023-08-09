// import components
import React from "react";
import "./style.css";

import Event from "../Event/Event";

import { Button } from "@material-ui/core";

// start react class
export default function EventList(props) {
  // begin react render
  return (
    <div className="EventList">
      {props.data.notes.map((note) => {
        return (
          <div key={note.id}>
            <Event data={note} setSelectedNote={props.setSelectedNote} />
          </div>
        );
      })}
      <Button variant="outlined" onClick={props.newNote} color="primary" className="newNoteButton">New Note</Button>
    </div>
  );
}
