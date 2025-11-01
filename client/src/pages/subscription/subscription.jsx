import * as React from "react";
import "./subscription.css";
import { Paper, Box, Typography, Snackbar, Alert } from "@mui/material";
import Filters from "./Filters";
import SubscriptionsTable from "./SubscriptionsTable";
import AddDialog from "./AddDialog";
import EditDialog from "./EditDialog";
import { getSubs } from "../newUser/userApiService";
import { pauseSub, resumeSub, restoreSub, cancelSub, hardDelete } from "./actions";
import { useDebouncedValue } from "./hook";
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function SubscriptionPage() {
  const { user, hasPermission, authenticatedFetch } = useAuth();

  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState([{ field: "end_date", sort: "asc" }]);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [expiresInDays, setExpiresInDays] = React.useState("");
  const qDebounced = useDebouncedValue(query, 350);
  const expDebounced = useDebouncedValue(expiresInDays, 350);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "info" });
  const [actionBusyId, setActionBusyId] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [editError, setEditError] = React.useState("");
  const ctrlRef = React.useRef(null);

  const fetchSubs = React.useCallback(async () => {
    if (!hasPermission('view_subscriptions')) {
      setRows([]);
      setRowCount(0);
      return;
    }

    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true);
    try {
      const { rows, total } = await getSubs(authenticatedFetch, {
        paginationModel,
        sortModel,
        query: qDebounced,
        status,
        expiresInDays: expDebounced,
        signal: ctrl.signal,
      });
      setRows(rows);
      setRowCount(total);
    } catch (e) {
      console.error(e);
      setRows([]);
      setRowCount(0);
      snack("שגיאה בטעינת המנויים", "error");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, qDebounced, status, expDebounced, hasPermission, authenticatedFetch, user]);

  React.useEffect(() => {
    if (user && hasPermission('view_subscriptions')) {
      fetchSubs();
    }
    return () => ctrlRef.current?.abort();
  }, [fetchSubs, user, hasPermission]);

  React.useEffect(() => {
    if (user && hasPermission('view_subscriptions')) {
      setPaginationModel(p => (p.page === 0 ? p : { ...p, page: 0 }));
    }
  }, [qDebounced, status, expDebounced, user, hasPermission]);

  const snack = (message, severity = "info") => setSnackbar({ open: true, message, severity });
  const closeSnack = () => setSnackbar((s) => ({ ...s, open: false }));

  const doWrapped = async (key, fn, okMsg, errMsg) => {
    setActionBusyId(key);
    try {
      const { ok, status, json } = await fn();
      if (!ok) {
        snack(json?.error || errMsg || `שגיאת שרת (${status})`, status === 409 ? "warning" : "error");
      } else {
        snack(okMsg || "בוצע בהצלחה", "success");
        fetchSubs();
      }
    } catch {
      snack("שגיאת רשת", "error");
    } finally {
      setActionBusyId(null);
    }
  };

  const onDelete = (row) => {
    if (!hasPermission('delete_subscriptions')) {
      snack("אין לך הרשאות למחוק מנויים", "error");
      return;
    }
    doWrapped(`/S/${row.id}`, () => hardDelete(authenticatedFetch, row.id), "המנוי נמחק בהצלחה", "שגיאה במחיקת מנוי");
  };

  const onPause = (row) => {
    if (!hasPermission('manage_subscriptions')) {
      snack("אין לך הרשאות לנהל מנויים", "error");
      return;
    }
    doWrapped(`/S/${row.id}/pause`, () => pauseSub(authenticatedFetch, row.id), "המנוי הוקפא בהצלחה", "שגיאה בהקפאת המנוי");
  };

  const onResume = (row) => {
    if (!hasPermission('manage_subscriptions')) {
      snack("אין לך הרשאות לנהל מנויים", "error");
      return;
    }
    doWrapped(`/S/${row.id}/resume`, () => resumeSub(authenticatedFetch, row.id), "המנוי חודש בהצלחה", "שגיאה בחידוש מהקפאה");
  };

  const onCancel = (row) => {
    if (!hasPermission('manage_subscriptions')) {
      snack("אין לך הרשאות לנהל מנויים", "error");
      return;
    }
    doWrapped(`/S/${row.id}/cancel`, () => cancelSub(authenticatedFetch, row.id), "המנוי בוטל בהצלחה", "שגיאה בביטול המנוי");
  };

  const onRestore = (row) => {
    if (!hasPermission('manage_subscriptions')) {
      snack("אין לך הרשאות לנהל מנויים", "error");
      return;
    }
    doWrapped(`/S/${row.id}/restore`, () => restoreSub(authenticatedFetch, row.id), "המנוי שוחזר בהצלחה", "שגיאה בשחזור המנוי");
  };

  const openEdit = (row) => {
    if (!hasPermission('edit_subscriptions')) {
      snack("אין לך הרשאות לערוך מנויים", "error");
      return;
    }
    setEditing({
      id: row.id,
      payment_status: row.payment_status ?? "pending",
      start_date_original: row.start_date ?? "",
      end_date_original: row.end_date ?? "",
      plan_id: row.plan_id || null,
      plan_type: row.plan_type || "",
      plan_name: row.plan_name || "",
      price: (row.price !== undefined && row.price !== null) ? row.price : (row.price === 0 ? 0 : ""),
    });
    setEditError("");
    setEditOpen(true);
  };

  const updateSubscription = async () => {
    if (!editing) return;
    setEditError("");
    try {
      const updateBody = {
        start_date: editing.start_date_original,
        end_date: editing.end_date_original,
        payment_status: editing.payment_status,
      };

      // Always send plan fields to preserve them
      // Send plan_type and plan_name if they exist
      if (editing.plan_type && editing.plan_type.trim() !== '') {
        updateBody.plan_type = editing.plan_type;
      }
      if (editing.plan_name && editing.plan_name.trim() !== '') {
        updateBody.plan_name = editing.plan_name;
      }
      // Always send price if it was provided (even if 0 or empty)
      // Check if price was explicitly set (not undefined)
      if (editing.price !== undefined && editing.price !== null && editing.price !== '') {
        const priceNum = parseFloat(editing.price);
        if (!isNaN(priceNum)) {
          updateBody.price = priceNum;
        }
      } else if (editing.price === 0 || editing.price === '0') {
        // Explicitly send 0 if price is explicitly 0
        updateBody.price = 0;
      }
      // Send plan_id only if it's a valid number (not 'current' or empty)
      if (editing.plan_id && editing.plan_id !== 'current' && editing.plan_id !== null && editing.plan_id !== '') {
        const planIdNum = parseInt(editing.plan_id);
        if (!isNaN(planIdNum)) {
          updateBody.plan_id = planIdNum;
        }
      }

      const res = await authenticatedFetch(`/S/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });
      if (res.ok) {
        setEditOpen(false);
        setEditing(null);
        snack("המנוי עודכן בהצלחה", "success");
        fetchSubs();
      } else {
        const j = await res.json().catch(() => ({}));
        setEditError(j?.error || (res.status === 409 ? "קיים מנוי פעיל/חופף למשתמש זה" : "שגיאה בעדכון מנוי"));
      }
    } catch {
      setEditError("שגיאת רשת");
    }
  };

  const createSubscription = async ({ user_id, start_date, end_date, payment_status }) => {
    if (!hasPermission('create_subscriptions')) {
      snack("אין לך הרשאות ליצור מנויים", "error");
      return;
    }

    try {
      const res = await authenticatedFetch(`/S`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, start_date, end_date, payment_status: payment_status || "pending" }),
      });
      if (res.ok) {
        setAddOpen(false);
        snack("מנוי נוצר בהצלחה", "success");
        fetchSubs();
      } else {
        const j = await res.json().catch(() => ({}));
        snack(j?.error || "שגיאה ביצירת מנוי", "error");
      }
    } catch {
      snack("שגיאת רשת", "error");
    }
  };

  const samePagination = (a, b) =>
    (a?.page === b?.page) && (a?.pageSize === b?.pageSize);

  const sameSortModel = (a = [], b = []) =>
    a.length === b.length && a.every((x, i) => x.field === b[i].field && x.sort === b[i].sort);

  const handlePaginationModelChange = React.useCallback((model) => {
    setPaginationModel(prev => (samePagination(prev, model) ? prev : model));
  }, []);

  const handleSortModelChange = React.useCallback((model) => {
    setSortModel(prev => (sameSortModel(prev, model) ? prev : model));
  }, []);

  if (!user) {
    return (
      <div className="subscriptions" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography>טוען...</Typography>
        </div>
      </div>
    );
  }

  if (!hasPermission('view_subscriptions')) {
    return (
      <div className="subscriptions" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography color="error">
            אין לך הרשאות לצפות במנויים
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="subscriptions" dir="rtl">
      <Typography className="subscriptions__title" variant="h5">
        ניהול מנויים
      </Typography>

      <Box className="subscriptions__filters rtlFormControl">
        <Filters
          query={query} onQueryChange={setQuery}
          status={status} onStatusChange={setStatus}
          expiresInDays={expiresInDays} onExpiresChange={setExpiresInDays}
          onAdd={() => {
            if (!hasPermission('create_subscriptions')) {
              snack("אין לך הרשאות ליצור מנויים", "error");
              return;
            }
            setAddOpen(true);
          }}
          onReset={() => { setQuery(""); setStatus(""); setExpiresInDays(""); }}
          canAdd={hasPermission('create_subscriptions')}
        />
      </Box>

      <Paper className="subscriptionList">
        <SubscriptionsTable
          rows={rows}
          rowCount={rowCount}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          onEdit={openEdit} onDelete={onDelete}
          onPause={onPause} onResume={onResume} onCancel={onCancel} onRestore={onRestore}
          actionBusyId={actionBusyId}
          canEdit={hasPermission('edit_subscriptions')}
          canDelete={hasPermission('delete_subscriptions')}
          canManage={hasPermission('manage_subscriptions')}
        />
      </Paper>

      <AddDialog API_BASE={API_BASE} open={addOpen} onClose={() => setAddOpen(false)} onCreate={createSubscription} />

      <EditDialog
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditError(""); }}
        editing={editing}
        setEditing={setEditing}
        onUpdate={updateSubscription}
        errorMsg={editError}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{
          '& .MuiSnackbar-root': {
            bottom: '24px',
            right: '24px'
          }
        }}
      >
        <Alert 
          onClose={closeSnack} 
          severity={snackbar.severity} 
          sx={{ 
            width: "100%",
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '12px 16px',
            minWidth: '300px',
            maxWidth: '400px',
            '& .MuiAlert-message': {
              padding: 0,
              fontWeight: 600,
              fontSize: '0.875rem'
            },
            '& .MuiAlert-action': {
              padding: 0,
              marginLeft: '8px'
            },
            '& .MuiIconButton-root': {
              padding: '4px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.05)'
              }
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
