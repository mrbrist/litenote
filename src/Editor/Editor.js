// import components
import React from "react";
import "./style.css";

// start react class
class Editor extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  // begin react render
  render() {
    // console.log(this.props.data);
    return (
      <div className="Editor">
        <textarea id="EditorTE"></textarea>
      </div>
    );
  }
}

export default Editor;
