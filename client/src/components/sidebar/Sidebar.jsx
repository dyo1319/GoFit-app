import "./sidebar.css";
import { NavLink } from "react-router-dom";
import {
  LineStyle,  TrendingUp, PermIdentity,
  AttachMoney, BarChart, WorkOutline, 
  CreditCard, ReceiptLong, CalendarMonth, FitnessCenter,
  Assessment,  Logout
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";


const linkCls = ({ isActive }) => `link ${isActive ? "active" : ""}`;

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <div className="sidebar" dir="rtl">
      <div className="sidebarWrapper">
        <div className="sidebarMenu">
          <h3 className="sidebarTitle">לוח בקרה</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/admin" className={linkCls}>
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
              <NavLink to="/admin/users" className={linkCls}>
                <PermIdentity className="sidebarIcon" />
                משתמשים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/subscriptions" className={linkCls}>
                <TrendingUp className="sidebarIcon" />
                מנויים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/renewals/upcoming" className={linkCls}>
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
              <NavLink to="/admin/payments/pending" className={linkCls}>
                <CreditCard className="sidebarIcon" />
                תשלומים בהמתנה
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/invoices" className={linkCls}>
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
              <NavLink to="/admin/classes" className={linkCls}>
                <CalendarMonth className="sidebarIcon" />
                לו״ז שיעורים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/exercises" className={linkCls}>
                <FitnessCenter className="sidebarIcon" />
                ספריית תרגילים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/programs" className={linkCls}>
                <Assessment className="sidebarIcon" />
                תוכניות אימון
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebarMenu">
          <h3 className="sidebarTitle">דוחות</h3>
          <ul className="sidebarList">
            <li className="sidebarListItem">
              <NavLink to="/admin/reports/usage" className={linkCls}>
                <Assessment className="sidebarIcon" />
                שימוש ופעילות
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/reports/churn" className={linkCls}>
                <BarChart className="sidebarIcon" />
                נטישת מנויים
              </NavLink>
            </li>
            <li className="sidebarListItem">
              <NavLink to="/admin/reports/monthly" className={linkCls}>
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
              <NavLink to="/admin/permissions" className={linkCls}>
                <WorkOutline className="sidebarIcon" />
                צוות/הרשאות
              </NavLink>
            </li>
           <li className="sidebarListItem"
              onClick={() => {
                signOut();
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
  );
}
