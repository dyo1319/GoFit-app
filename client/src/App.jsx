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
import Unauthorized from "./pages/unauthorized/Unauthorized";
import Dashboard from "./pages/main-dashboard/Dashboard";
import Workouts from "./pages/workout/Workouts";
import Membership from "./pages/membership/Membership";
import Profile from "./pages/profile/Profile";
import Exercises from "./pages/exrcises-admin/Exercises";
import TrainingPrograms from "./pages/TrainingProgram-admin/TrainingPrograms";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const StaffRoute = ({ children }) => {
  const { user } = useAuth();
  const isStaff = user?.role === "trainer" || user?.role === "admin";
  return isStaff ? children : <Navigate to="/unauthorized" replace />;
};

const PermissionRoute = ({ perm, children }) => {
  const { hasPermission, user } = useAuth();
  if (user?.role === "admin" || (perm && hasPermission(perm))) return children;
  return <Navigate to="/unauthorized" replace />;
};

const AdminLayout = ({ children }) => {
  return (
    <>
      <Topbar />
      <div className="container">
        <Sidebar />
        {children}
      </div>
    </>
  );
};

const AppLayout = ({ children }) => {
  return <div className="app-layout">{children}</div>;
};

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <SignIn />}
      />

      <Route
        path="/unauthorized"
        element={
          <ProtectedRoute>
            <Unauthorized />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout>
             <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/workouts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Workouts />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/membership"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Membership />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <Home />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <UserList />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/user/:id"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <User />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/newUser"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <NewUserPage />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <Subscriptions />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/renewals/upcoming"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <UpcomingRenewalsPage />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payments/pending"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <PendingPayments />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <NotificationsPage />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/permissions"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <PermissionRoute perm="manage_permissions">
                  <PermissionsPage />
                </PermissionRoute>
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/team"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <PermissionsPage />
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/exercises"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <PermissionRoute perm="manage_plans">
                  <Exercises />
                </PermissionRoute>
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/programs"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AdminLayout>
                <PermissionRoute perm="manage_plans">
                  <TrainingPrograms />
                </PermissionRoute>
              </AdminLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={isAuthenticated ? "/app" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
