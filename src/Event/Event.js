// import components
import React from "react";
import "./style.css";

import Paper from "@material-ui/core/Paper";

// start react class
export default function Event(props) {

  // begin react render
  return (
    <div
      className="Event"
      onClick={() => props.setSelectedNote(props.data.id)}
    >
      <Paper elevation={2} className="EventPaper">
        <span className="eventName">{props.data.name}</span>
        {/* <span className="eventStart">
            {this.convertDate(this.props.data.start)}
          </span> */}
        {/* <span className="eventLength">
            {this.msToTime(this.props.data.end - this.props.data.start)}
          </span> */}
        {/* <span className="eventLocation">{this.props.data.location}</span> */}
      </Paper>
    </div>
  );
}