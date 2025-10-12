// client/src/notifications/NotificationsPage.jsx
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
import { getNotifications, markAsRead, deleteOne, markAllAsRead, clearAll } from "./notificationsApi";
import { useDebouncedValue } from "../subscription/hook";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function NotificationsPage() {
  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("");
  const [onlyUnread, setOnlyUnread] = React.useState(true);
  const qDebounced = useDebouncedValue(query, 350);

  const [snackbar, setSnackbar] = React.useState({ 
    open: false, 
    message: "", 
    severity: "info" 
  });
  const ctrlRef = React.useRef(null);

  const snack = (message, severity = "info") => 
    setSnackbar({ open: true, message, severity });
  
  const closeSnack = () => 
    setSnackbar((s) => ({ ...s, open: false }));

  const fetchData = React.useCallback(async () => {
    // Abort previous request
    if (ctrlRef.current) {
      ctrlRef.current.abort();
    }
    
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    
    setLoading(true);
    try {
      const { rows, total } = await getNotifications(API_BASE, {
        paginationModel,
        query: qDebounced,
        type,
        onlyUnread,
        signal: ctrl.signal,
      });
      
      setRows(rows);
      setRowCount(total);
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
  }, [paginationModel, qDebounced, type, onlyUnread]);

  // Fetch data when dependencies change
  React.useEffect(() => { 
    fetchData(); 
    return () => ctrlRef.current?.abort();
  }, [fetchData]);

  // Reset to first page when filters change
  React.useEffect(() => { 
    setPaginationModel((p) => ({ ...p, page: 0 })); 
  }, [qDebounced, type, onlyUnread]);

  const handleMarkRead = async (row) => {
    setLoading(true);
    try {
      const { ok, json } = await markAsRead(API_BASE, row.id);
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
    setLoading(true);
    try {
      const { ok, json } = await deleteOne(API_BASE, row.id);
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
    setLoading(true);
    try {
      const { ok, json } = await markAllAsRead(API_BASE);
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
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את כל ההתראות? פעולה זו אינה ניתנת לביטול.")) {
      return;
    }

    setLoading(true);
    try {
      const { ok, json } = await clearAll(API_BASE);
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
            onRefresh={fetchData}
            onMarkAll={handleMarkAll}
            onClearAll={handleClearAll}
            loading={loading}
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