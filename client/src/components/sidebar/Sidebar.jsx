import React, { useEffect } from "react";
import "./sidebar.css";
import { NavLink } from "react-router-dom";
import {
  LineStyle,  TrendingUp, PermIdentity,
  AttachMoney, WorkOutline, 
  CreditCard, ReceiptLong, FitnessCenter,
  Assessment,  Logout, Close
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

const linkCls = ({ isActive }) => `link ${isActive ? "active" : ""}`;

export default function Sidebar({ isMobileMenuOpen, onCloseMobileMenu }) {
  const { signOut } = useAuth();

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      onCloseMobileMenu();
    }
  };
  useEffect(() => {
    if (isMobileMenuOpen && window.innerWidth <= 768) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  return (
    <React.Fragment>
      <div 
        className={`mobile-backdrop ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={onCloseMobileMenu}
      />
      
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} dir="rtl">
        <div className="sidebarWrapper">
          <div className="sidebar-header">
            <button 
              className="sidebar-close-btn"
              onClick={onCloseMobileMenu}
              aria-label="Close menu"
            >
              <Close />
            </button>
          </div>
        <div className="sidebarMenu">
          <h3 className="sidebarTitle">לוח בקרה</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem" data-item="home">
              <NavLink to="/admin" end className={linkCls} onClick={handleNavClick}>
                <LineStyle className="sidebarIcon" />
                דף הבית
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">לקוחות ומנויים</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/admin/users" className={linkCls} onClick={handleNavClick}>
                <PermIdentity className="sidebarIcon" />
                משתמשים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/subscriptions" className={linkCls} onClick={handleNavClick}>
                <TrendingUp className="sidebarIcon" />
                מנויים
              </NavLink>
            </li>
            <li className="sidebarListItem" data-item="renewals">
              <NavLink to="/admin/renewals/upcoming" className={linkCls} onClick={handleNavClick}>
                <ReceiptLong className="sidebarIcon" />
                חידושים קרובים
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">תשלומים וחשבוניות</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/admin/payments/pending" className={linkCls} onClick={handleNavClick}>
                <CreditCard className="sidebarIcon" />
                תשלומים בהמתנה
              </NavLink>
            </li>
            <li className="sidebarListItem" data-item="invoices">
              <NavLink to="/admin/invoices" className={linkCls} onClick={handleNavClick}>
                <AttachMoney className="sidebarIcon" />
                חשבוניות
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">אימונים</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/admin/exercises" className={linkCls} onClick={handleNavClick}>
                <FitnessCenter className="sidebarIcon" />
                ספריית תרגילים
              </NavLink>
            </li>
            <li className="sidebarListItem" data-item="programs">
              <NavLink to="/admin/programs" className={linkCls} onClick={handleNavClick}>
                <Assessment className="sidebarIcon" />
                תוכניות אימון
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="sidebarMenu">
          <h3 className="sidebarTitle">צוות והגדרות</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/admin/permissions" className={linkCls} onClick={handleNavClick}>
                <WorkOutline className="sidebarIcon" />
                צוות/הרשאות
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu logout-section">
          <ul className="sidebarList">
            <li className="sidebarListItem"
              onClick={() => {
                signOut();
                handleNavClick();
              }}
              role="button"
              tabIndex={0}
            >
              <Logout className="sidebarIcon" />
              התנתקות
            </li>
          </ul>
        </div>
        </div>
      </div>
    </React.Fragment>
  );
}
