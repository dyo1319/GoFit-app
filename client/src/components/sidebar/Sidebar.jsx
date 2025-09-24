import "./sidebar.css";
import { NavLink } from "react-router-dom";
import {
  LineStyle, Timeline, TrendingUp, PermIdentity,
  AttachMoney, BarChart, WorkOutline, Report,
  CreditCard, ReceiptLong, CalendarMonth, FitnessCenter,
  Assessment, Notifications, Logout, DarkMode
} from "@mui/icons-material";

const linkCls = ({ isActive }) => `link ${isActive ? "active" : ""}`;

export default function Sidebar() {
  return (
    <div className="sidebar" dir="rtl">
      <div className="sidebarWrapper">
        <div className="sidebarMenu">
          <h3 className="sidebarTitle">לוח בקרה</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/" className={linkCls}>
                <LineStyle className="sidebarIcon" />
                דף הבית
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/analytics" className={linkCls}>
                <Timeline className="sidebarIcon" />
                ניתוח נתונים
              </NavLink>
            </li>

            <li className="sidebarListItem">
              <NavLink to="/alerts" className={linkCls}>
                <Notifications className="sidebarIcon" />
                התראות
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">לקוחות ומנויים</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/users" className={linkCls}>
                <PermIdentity className="sidebarIcon" />
                משתמשים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/subscriptions" className={linkCls}>
                <TrendingUp className="sidebarIcon" />
                מנויים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/renewals/upcoming" className={linkCls}>
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
              <NavLink to="/payments/pending" className={linkCls}>
                <CreditCard className="sidebarIcon" />
                תשלומים בהמתנה
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/invoices" className={linkCls}>
                <AttachMoney className="sidebarIcon" />
                חשבוניות
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">אימונים ושיעורים</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/classes" className={linkCls}>
                <CalendarMonth className="sidebarIcon" />
                לו״ז שיעורים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/programs" className={linkCls}>
                <FitnessCenter className="sidebarIcon" />
                תוכניות אימון
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/attendance" className={linkCls}>
                <Report className="sidebarIcon" />
                נוכחות
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">דוחות</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/reports/usage" className={linkCls}>
                <Assessment className="sidebarIcon" />
                שימוש ופעילות
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/reports/churn" className={linkCls}>
                <BarChart className="sidebarIcon" />
                נטישת מנויים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/reports/monthly" className={linkCls}>
                <BarChart className="sidebarIcon" />
                דוח חודשי
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">צוות והגדרות</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/team" className={linkCls}>
                <WorkOutline className="sidebarIcon" />
                צוות/הרשאות
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/logout" className={linkCls}>
                <Logout className="sidebarIcon" />
                התנתקות
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
