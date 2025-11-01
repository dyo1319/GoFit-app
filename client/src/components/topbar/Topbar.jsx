import React from "react";
import "./topbar.css";
import { Menu } from "@mui/icons-material";
import { 
  IconButton
} from "@mui/material";
import NotificationCenter from "../NotificationCenter";

export default function Topbar({ onMenuToggle }) {
  return (
    <div className="topbar">
      <div className="topbarWrapper">
        <div className="topLeft">
          <span className="logo">GoFit</span>
        </div>
        <div className="topRight">
          <NotificationCenter />
          <IconButton 
            color="inherit" 
            onClick={onMenuToggle}
            sx={{ display: { xs: 'flex', md: 'none' } }}
            className="hamburger-button"
          >
            <Menu />
          </IconButton>
        </div>
      </div>
    </div>
  );
}