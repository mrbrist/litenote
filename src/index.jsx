import { createRoot } from "react-dom/client";
import "./fonts";
import "./index.css";
import App from "./App/App";

// window.litenote is provided by electron/preload.cjs.
createRoot(document.getElementById("root")).render(<App api={window.litenote} />);
