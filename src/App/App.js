// import components
import React from "react";
import "./style.css";

// import custom modules
import Titlebar from "../Titlebar/Titlebar";
import EventList from "../EventList/EventList";
import Editor from "../Editor/Editor";

const ical = window.require("ical");
const fs = window.require("fs");
const remote = window.require("electron").remote;
const win = remote.getCurrentWindow();

// start react class
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      ttLoaded: true,
      ical_data_arr: [],
      showList: true,
      showEditor: false,
      selectedEvent: undefined,
    };
  }
  componentDidMount() {
    const data = fs.readFileSync("src/App/Teaching.ics", "utf8");
    const ical_parse = ical.parseICS(data);
    let temp_arr = [];
    for (let k in ical_parse) {
      if (ical_parse.hasOwnProperty(k)) {
        var ev = ical_parse[k];
        if (ical_parse[k].type === "VEVENT") {
          if (!ev.summary.includes("Ind: ")) {
            temp_arr.push(ev);
          }
        }
      }
    }
    this.setState({
      ical_data_arr: temp_arr,
    });
  }
  // begin react render
  render() {
    return (
      <div className="App">
        <Titlebar
          close={this.titlebar_close}
          min={this.titlebar_min}
          maxrestore={this.titlebar_maxrestore}
          switch_window={this.switch_window}
        />
        <div id="AppContent">
          {this.state.ttLoaded ? (
            <div>
              {this.state.showList ? (
                <EventList
                  selectEvent={this.select_event}
                  data={this.state.ical_data_arr}
                />
              ) : (
                <Editor data={this.state.selectedEvent} />
              )}
            </div>
          ) : (
            <div>
              <span>No timetable imported</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  titlebar_close = () => {
    win.close();
  };
  titlebar_min = () => {
    win.minimize();
  };
  titlebar_maxrestore = () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  };
  switch_window = () => {
    if (this.state.showList) {
      if (this.state.selectedEvent !== undefined) {
        this.setState({
          showEditor: true,
          showList: false,
        });
      }
    } else {
      this.setState({
        showEditor: false,
        showList: true,
      });
    }
  };
  select_event = (event) => {
    this.setState({
      selectedEvent: event,
    });
    this.setState({
      showEditor: true,
      showList: false,
    });
  };
}

export default App;
