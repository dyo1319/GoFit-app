import Sidebar from "./components/sidebar/Sidebar";
import Topbar from "./components/topbar/Topbar";
import "./App.css";
import Home from "./pages/home/Home";
import UserList from "./pages/userList/UserList";
import User from "./pages/user/User";
import NewUserPage from "./pages/newUser/NewUserPage";
import Subscriptions from "./pages/subscription/subscription";
import UpcomingRenewalsPage from "./pages/renewals/upcomingrenewals";
import PendingPayments from "./pages/payments/PendingPayments";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import PermissionsPage from "./pages/permissions/PermissionsPage";
import SignIn from "./pages/login/SignIn";

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation,useNavigate } from "react-router-dom";



function AppContent() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const nav = useNavigate();

  const handleSignInSuccess = () => {
    // אחרי התחברות – נווט ישר לאדמין (אפשר להחליף בהמשך לפי role)
    nav("/admin", { replace: true });
  };

  return (
    <>
      {isAdmin && <Topbar />}
      <div className="container">
        {isAdmin && <Sidebar />}
        <Routes>
          {/* דף התחברות (ללא טופ/סייד) */}
          <Route path="/login" element={
            <SignIn onSignInSuccess={handleSignInSuccess} onSwitchToSignUp={() => {}} />
          } />

          {/* אזור אדמין */}
          <Route path="/admin" element={<Home />} />
          <Route path="/admin/users" element={<UserList />} />
          <Route path="/admin/user/:id" element={<User />} />
          <Route path="/admin/newUser" element={<NewUserPage />} />
          <Route path="/admin/subscriptions" element={<Subscriptions />} />
          <Route path="/admin/renewals/upcoming" element={<UpcomingRenewalsPage />} />
          <Route path="/admin/payments/pending" element={<PendingPayments />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/permissions" element={<PermissionsPage />} />
          <Route path="/admin/team" element={<PermissionsPage />} />

          {/* ברירת מחדל: שלח ל /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;









