import { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import "./style.css";

import NoteList from "../NoteList/NoteList";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, PlusIcon } from "../icons";
import { SORT_OPTIONS } from "../notes";
import { findOption } from "../settings";

function SortMenu({ sort, onChange }) {
  const [anchor, setAnchor] = useState(null);
  const current = findOption(SORT_OPTIONS, sort);
  const Arrow = sort.endsWith("asc") ? ArrowUpIcon : ArrowDownIcon;

  return (
    <>
      <button
        type="button"
        className="ghostButton SortButton"
        aria-label={`Sort notes: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {current.short}
        <Arrow size={12} />
      </button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            role="menuitemradio"
            aria-checked={option.value === sort}
            selected={option.value === sort}
            onClick={() => {
              setAnchor(null);
              onChange(option.value);
            }}
          >
            <span className="SortCheck">
              {option.value === sort && <CheckIcon size={14} />}
            </span>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default function Sidebar({ notes, sort, onSortChange, onCreate, shortcut, ...listProps }) {
  return (
    <nav className="Sidebar" aria-label="Sidebar">
      <div className="SidebarHeader">
        <h2 className="SidebarTitle">
          Notes <span className="SidebarCount">{notes.length}</span>
        </h2>
        <SortMenu sort={sort} onChange={onSortChange} />
        <Tooltip title={<>New note <kbd>{shortcut("N")}</kbd></>}>
          <button
            type="button"
            className="ghostButton"
            aria-label="New Note"
            onClick={() => onCreate()}
          >
            <PlusIcon />
          </button>
        </Tooltip>
      </div>
      <div className="SidebarScroll">
        {notes.length > 0 ? (
          <NoteList notes={notes} {...listProps} />
        ) : (
          <div className="SidebarEmpty">
            <p>No notes yet.</p>
            <button type="button" className="primaryButton" onClick={() => onCreate()}>
              <PlusIcon size={14} /> Create a note
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
