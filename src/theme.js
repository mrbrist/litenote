import { createTheme } from "@mui/material/styles";

// Material UI theme for the menus, dialogs and switches. The colours mirror
// the tokens in src/index.css; only the accent changes at runtime.
export function createAppTheme(accent) {
  return createTheme({
    palette: {
      mode: "dark",
      primary: { main: accent },
      error: { main: "#e8868c" },
      background: { default: "#111318", paper: "#1a1d24" },
      text: { primary: "#e2e5eb", secondary: "#9299a6" },
      divider: "#262a33",
    },
    shape: { borderRadius: 6 },
    typography: {
      fontFamily: "var(--font-family)",
      fontSize: 13,
      button: { textTransform: "none", fontWeight: 500 },
    },
    transitions: { duration: { enteringScreen: 160, leavingScreen: 120 } },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none", border: "1px solid #262a33" },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { minWidth: 180, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)" },
          list: { padding: 4 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: 13,
            borderRadius: 4,
            minHeight: 32,
            gap: 10,
            "&.Mui-focusVisible": { backgroundColor: "rgba(255, 255, 255, 0.06)" },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)" },
        },
      },
      MuiBackdrop: {
        styleOverrides: { root: { backgroundColor: "rgba(8, 9, 12, 0.6)" } },
      },
      MuiTooltip: {
        defaultProps: { enterDelay: 500, disableInteractive: true },
        styleOverrides: {
          tooltip: {
            fontSize: 12,
            backgroundColor: "#262a33",
            color: "#e2e5eb",
            border: "1px solid #323844",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
    },
  });
}
