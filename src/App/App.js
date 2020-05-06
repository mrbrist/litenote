import React from "react";
import "./style.css";

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      ttLoaded: false,
    };
  }
  render() {
    return (
      <div className="App">
        {this.ttLoaded ? (
          <div>
            <span>timetable imported</span>
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
