// import components
import React from "react";
import "./style.css";
// import icalData from "./Teaching.ics";

const ical = window.require("ical");
const fs = window.require("fs");

// start react class
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      ttLoaded: true,
      ical_data_arr: [],
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
          temp_arr.push(ev);
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
        {this.state.ttLoaded ? (
          <div>
            {this.state.ical_data_arr.map((event) => {
              return (
                <div key={event.uid}>
                  {JSON.stringify(event)}
                  <br />
                  <br />
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <span>No timetable imported</span>
          </div>
        )}
      </div>
    );
  }
}

export default App;
