// import components
import React from "react";
import "./style.css";

// material ui
import Button from "@material-ui/core/Button";

// start react class
class Titlebar extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  // begin react render
  render() {
    return (
      <div className="Titlebar">
        <Button
          id="titleButton"
          size="small"
          onClick={() => this.props.switch_window()}
        >
          litenote
        </Button>
        <div id="TitleBarControls">
          <div
            className="button"
            id="min-button"
            onClick={() => this.props.min()}
          >
            <svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
              <rect
                fill="currentColor"
                width="10"
                height="1"
                x="1"
                y="6"
              ></rect>
            </svg>
          </div>
          <div
            className="button"
            id="max-button"
            onClick={() => this.props.maxrestore()}
          >
            <svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
              <rect
                width="9"
                height="9"
                x="1.5"
                y="1.5"
                fill="none"
                stroke="currentColor"
              ></rect>
            </svg>
          </div>
          <div
            className="button"
            id="close-button"
            onClick={() => this.props.close()}
          >
            <svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
              <polygon
                fill="currentColor"
                fillRule="evenodd"
                points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
              ></polygon>
            </svg>
          </div>
        </div>
      </div>
    );
  }
}

export default Titlebar;
