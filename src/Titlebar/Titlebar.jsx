import Tooltip from "@mui/material/Tooltip";
import "./style.css";

import { BackIcon, SettingsIcon, SidebarIcon } from "../icons";

// The window controls themselves are drawn by the OS (see electron/main.js);
// this bar only reserves room for them on the correct side.
export default function Titlebar({
  platform,
  title,
  onBack,
  sidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  shortcut,
}) {
  return (
    <div className={`Titlebar Titlebar--${platform}`}>
      <div className="TitlebarActions">
        {onBack && (
          <button type="button" className="ghostButton backButton" onClick={() => onBack()}>
            <BackIcon />
            Notes
          </button>
        )}
        {onToggleSidebar && (
          <Tooltip title={<>{sidebarOpen ? "Hide" : "Show"} sidebar <kbd>{shortcut("\\")}</kbd></>}>
            <button
              type="button"
              className="ghostButton"
              aria-label="Show sidebar"
              aria-pressed={sidebarOpen}
              onClick={() => onToggleSidebar()}
            >
              <SidebarIcon />
            </button>
          </Tooltip>
        )}
        {onOpenSettings && (
          <Tooltip title={<>Settings <kbd>{shortcut(",")}</kbd></>}>
            <button
              type="button"
              className="ghostButton"
              aria-label="Settings"
              onClick={() => onOpenSettings()}
            >
              <SettingsIcon />
            </button>
          </Tooltip>
        )}
      </div>
      <span className="titlebarTitle">{title}</span>
    </div>
  );
}
