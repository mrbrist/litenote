import Button from "@mui/material/Button";
import "./style.css";

import NoteCard from "../NoteCard/NoteCard";

export default function NoteList({ notes, onSelect, onCreate }) {
  return (
    <div className="NoteList">
      {notes.map((note) => (
        <div key={note.id}>
          <NoteCard note={note} onSelect={onSelect} />
        </div>
      ))}
      <Button
        variant="outlined"
        onClick={() => onCreate()}
        color="primary"
        className="newNoteButton"
      >
        <span className="buttonLabel">New Note</span>
      </Button>
    </div>
  );
}
