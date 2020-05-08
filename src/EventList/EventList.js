// import components
import React from "react";
import "./style.css";

import Event from "../Event/Event";

// start react class
class EventList extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  // begin react render
  render() {
    return (
      <div className="EventList">
        {this.props.data.map((event) => {
          return (
            <div key={event.uid}>
              <Event data={event} selectEvent={this.props.selectEvent} />
            </div>
          );
        })}
      </div>
    );
  }
}

export default EventList;
