import Button from "@mui/material/Button";
import SvgIcon from "@mui/material/SvgIcon";
import "./style.css";

function BackIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </SvgIcon>
  );
}

// The window controls themselves are drawn by the OS (see electron/main.js);
// this bar only reserves room for them on the correct side.
export default function Titlebar({ platform, title, onBack }) {
  return (
    <div className={`Titlebar Titlebar--${platform}`}>
      {onBack && (
        <Button
          className="backButton"
          size="small"
          color="inherit"
          startIcon={<BackIcon />}
          onClick={() => onBack()}
        >
          Notes
        </Button>
      )}
      <span className="titlebarTitle">{title}</span>
    </div>
  );
}
