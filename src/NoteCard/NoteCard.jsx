import Paper from "@mui/material/Paper";
import "./style.css";

export default function NoteCard({ note, onSelect }) {
  return (
    <div className="NoteCard" onClick={() => onSelect(note.id)}>
      <Paper elevation={2} className="NoteCardPaper">
        <span className="noteName">{note.name}</span>
      </Paper>
    </div>
  );
}
