import Sidebar from "./components/sidebar/Sidebar";
import Topbar from "./components/topbar/Topbar";
import "./App.css";
import Home from "./pages/home/Home";
import UserList from "./pages/userList/UserList";
import User from "./pages/user/User";
import NewUserPage from "./pages/newUser/NewUserPage";
import Subscriptions from "./pages/subscription/subscription";
import UpcomingRenewalsPage from "./pages/renewals/upcomingrenewals";


import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <Router>
      <Topbar />
      <div className="container">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/user/:id" element={<User />} />
          <Route path="/newUser" element={<NewUserPage />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/renewals/upcoming" element={<UpcomingRenewalsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
