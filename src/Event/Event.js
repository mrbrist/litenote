// import components
import React from "react";
import "./style.css";

import Paper from "@material-ui/core/Paper";

// start react class
class Event extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  // begin react render
  render() {
    // console.log(this.props.data);
    return (
      <div
        className="Event"
        onClick={() => this.props.selectEvent(this.props.data)}
      >
        <Paper elevation={2} className="EventPaper">
          <span className="eventName">{this.props.data.summary}</span>
          <span className="eventStart">
            {this.convertDate(this.props.data.start)}
          </span>
          <span className="eventLength">
            {this.msToTime(this.props.data.end - this.props.data.start)}
          </span>
          <span className="eventLocation">{this.props.data.location}</span>
        </Paper>
      </div>
    );
  }
  msToTime = (duration) => {
    var minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? hours : hours;

    if (minutes > 0) {
      minutes = minutes < 10 ? "0" + minutes : minutes;
      return hours + "hrs " + minutes + "m";
    } else if (hours > 1) {
      return hours + "hrs";
    } else {
      return hours + "hr";
    }
  };
  convertDate = (date) => {
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let mins;
    if (date.getMinutes() < 10) {
      mins = "0" + date.getMinutes();
    } else {
      mins = date.getMinutes();
    }
    return (
      days[date.getDay()] +
      " " +
      date.getDate() +
      " " +
      months[date.getMonth()] +
      " @ " +
      date.getHours() +
      ":" +
      mins
    );
  };
}

export default Event;
