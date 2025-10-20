import * as React from "react";
import { 
  Paper, 
  Box, 
  Typography, 
  Snackbar, 
  Alert,
  CircularProgress,
  Container
} from "@mui/material";
import NotificationsFilters from "./NotificationsFilters";
import NotificationsTable from "./NotificationsTable";
import { 
  getNotifications, 
  markAsRead, 
  deleteOne, 
  markAllAsRead, 
  clearAll,
  getNotificationStats
} from "./notificationsApi";
import { useDebouncedValue } from "../subscription/hook";
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { user, hasPermission, authenticatedFetch } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("");
  const [onlyUnread, setOnlyUnread] = React.useState(true);
  const [audience, setAudience] = React.useState(user?.role === 'admin' ? '' : 'user');
  const [stats, setStats] = React.useState(null);
  const qDebounced = useDebouncedValue(query, 350);

  const [snackbar, setSnackbar] = React.useState({ 
    open: false, 
    message: "", 
    severity: "info" 
  });
  const ctrlRef = React.useRef(null);

  React.useEffect(() => {
    if (user && !hasPermission('view_notifications')) {
      navigate('/unauthorized');
    }
  }, [user, hasPermission, navigate]);

  const snack = (message, severity = "info") => 
    setSnackbar({ open: true, message, severity });
  
  const closeSnack = () => 
    setSnackbar((s) => ({ ...s, open: false }));

  const fetchStats = React.useCallback(async () => {
    if (!hasPermission('view_notifications')) return;

    try {
      const statsData = await getNotificationStats(authenticatedFetch);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  }, [hasPermission, authenticatedFetch]);

  const fetchData = React.useCallback(async () => {
    if (!hasPermission('view_notifications')) {
      setRows([]);
      setRowCount(0);
      return;
    }

    if (ctrlRef.current) {
      ctrlRef.current.abort();
    }
    
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    
    setLoading(true);
    try {
      const { rows, total } = await getNotifications(authenticatedFetch, {
        paginationModel,
        query: qDebounced,
        type,
        onlyUnread,
        audience: user?.role === 'admin' ? audience : 'user',
        signal: ctrl.signal,
      });
      
      setRows(rows);
      setRowCount(total);
      
      fetchStats();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.name !== 'AbortError') {
        setRows([]);
        setRowCount(0);
        snack("שגיאה בטעינת ההתראות", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [paginationModel, qDebounced, type, onlyUnread, audience, user?.role, hasPermission, authenticatedFetch, fetchStats]);

  React.useEffect(() => { 
    if (user && hasPermission('view_notifications')) {
      fetchData(); 
    }
    return () => ctrlRef.current?.abort();
  }, [fetchData, user, hasPermission]);

  React.useEffect(() => { 
    if (user && hasPermission('view_notifications')) {
      setPaginationModel((p) => ({ ...p, page: 0 })); 
    }
  }, [qDebounced, type, onlyUnread, audience, user, hasPermission]);

  React.useEffect(() => {
    if (user && hasPermission('view_notifications')) {
      fetchStats();
    }
  }, [user, hasPermission, fetchStats]);

  const handleMarkRead = async (row) => {
    if (!hasPermission('manage_notifications')) {
      snack("אין לך הרשאות לנהל התראות", "error");
      return;
    }

    setLoading(true);
    try {
      const { ok, json } = await markAsRead(authenticatedFetch, row.id);
      if (ok) {
        snack("התראה סומנה כנקראה", "success");
        fetchData();
      } else {
        snack(json?.error || "שגיאה בסימון ההתראה", "error");
      }
    } catch (error) {
      snack("שגיאה בסימון ההתראה", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!hasPermission('manage_notifications')) {
      snack("אין לך הרשאות לנהל התראות", "error");
      return;
    }

    setLoading(true);
    try {
      const { ok, json } = await deleteOne(authenticatedFetch, row.id);
      if (ok) {
        snack("התראה נמחקה", "success");
        fetchData();
      } else {
        snack(json?.error || "שגיאה במחיקת ההתראה", "error");
      }
    } catch (error) {
      snack("שגיאה במחיקת ההתראה", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = async () => {
    if (!hasPermission('manage_notifications')) {
      snack("אין לך הרשאות לנהל התראות", "error");
      return;
    }

    setLoading(true);
    try {
      const { ok, json } = await markAllAsRead(authenticatedFetch);
      if (ok) {
        snack("כל ההתראות סומנו כנקראו", "success");
        fetchData();
      } else {
        snack(json?.error || "שגיאה בסימון כל ההתראות", "error");
      }
    } catch (error) {
      snack("שגיאה בסימון כל ההתראות", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!hasPermission('manage_notifications')) {
      snack("אין לך הרשאות לנהל התראות", "error");
      return;
    }

    if (!window.confirm("האם אתה בטוח שברצונך למחוק את כל ההתראות? פעולה זו אינה ניתנת לביטול.")) {
      return;
    }

    setLoading(true);
    try {
      const { ok, json } = await clearAll(authenticatedFetch);
      if (ok) {
        snack("כל ההתראות נמחקו", "success");
        fetchData();
      } else {
        snack(json?.error || "שגיאה במחיקת כל ההתראות", "error");
      }
    } catch (error) {
      snack("שגיאה במחיקת כל ההתראות", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography>טוען...</Typography>
        </div>
      </Container>
    );
  }

  if (!hasPermission('view_notifications')) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Alert severity="error" sx={{ maxWidth: 400, margin: '0 auto' }}>
            אין לך הרשאות לצפות בהתראות
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper 
        sx={{ 
          p: 3, 
          minHeight: 600,
          width: "100%",
          position: 'relative'
        }} 
        dir="rtl"
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            התראות
          </Typography>

          <NotificationsFilters
            query={query}
            onQueryChange={setQuery}
            type={type}
            onTypeChange={setType}
            onlyUnread={onlyUnread}
            onOnlyUnreadChange={setOnlyUnread}
            audience={audience}
            onAudienceChange={setAudience}
            onRefresh={fetchData}
            onMarkAll={handleMarkAll}
            onClearAll={handleClearAll}
            loading={loading}
            canManage={hasPermission('manage_notifications')}
            stats={stats}
            userRole={user?.role}
          />
        </Box>

        <NotificationsTable
          rows={rows}
          rowCount={rowCount}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
          canManage={hasPermission('manage_notifications')}
        />

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={closeSnack}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert 
            onClose={closeSnack} 
            severity={snackbar.severity} 
            sx={{ width: "100%" }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}