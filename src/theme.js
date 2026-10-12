import { createTheme } from "@mui/material/styles";

// Dark theme. Primary is a lighter indigo than MUI v4's default (#3f51b5) so
// it stays readable on a dark background.
export default createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#9fa8da",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
});
