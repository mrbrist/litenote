// import components
import React from "react";
import { useEffect, useState } from "react";
import "./style.css";

// start react class
export default function Editor(props) {
  const [data, setData] = useState('')
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (data !== "") {
        props.updateNote(props.note, data)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [data])
  // begin react render
  return (
    <div className="Editor">
      <textarea id="EditorTE" onChange={(e) => setData(e.target.value)} defaultValue={props.data.notes[props.note].data}></textarea>
    </div>
  );
}
