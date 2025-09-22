import * as React from "react";
import "./subscription.css";
import { Paper, Box, Typography, Snackbar, Alert } from "@mui/material";
import Filters from "./Filters";
import SubscriptionsTable from "./SubscriptionsTable";
import AddDialog from "./AddDialog";
import EditDialog from "./EditDialog";
import { getSubs } from "./api";
import { pauseSub, resumeSub, restoreSub, cancelSub, hardDelete } from "./actions";
import { useDebouncedValue } from "./hook";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function SubscriptionPage() {
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
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true);
    try {
      const { rows, total } = await getSubs(API_BASE, {
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
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, qDebounced, status, expDebounced]);

  React.useEffect(() => { fetchSubs(); return () => ctrlRef.current?.abort(); }, [fetchSubs]);

  React.useEffect(() => { setPaginationModel((p) => ({ ...p, page: 0 })); }, [qDebounced, status, expDebounced]);

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

  const onDelete  = (row) => doWrapped(`/S/${row.id}`,         () => hardDelete(API_BASE, row.id), "המנוי נמחק בהצלחה", "שגיאה במחיקת מנוי");
  const onPause   = (row) => doWrapped(`/S/${row.id}/pause`,   () => pauseSub(API_BASE, row.id),   "המנוי הוקפא בהצלחה", "שגיאה בהקפאת המנוי");
  const onResume  = (row) => doWrapped(`/S/${row.id}/resume`,  () => resumeSub(API_BASE, row.id),  "המנוי חודש בהצלחה",  "שגיאה בחידוש מהקפאה");
  const onCancel  = (row) => doWrapped(`/S/${row.id}/cancel`,  () => cancelSub(API_BASE, row.id),  "המנוי בוטל בהצלחה",  "שגיאה בביטול המנוי");
  const onRestore = (row) => doWrapped(`/S/${row.id}/restore`, () => restoreSub(API_BASE, row.id), "המנוי שוחזר בהצלחה", "שגיאה בשחזור המנוי");

  const openEdit = (row) => {
    setEditing({
      id: row.id,
      payment_status: row.payment_status ?? "pending",
      start_date_original: row.start_date ?? "",
      end_date_original: row.end_date ?? "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const updateSubscription = async () => {
    if (!editing) return;
    setEditError("");
    try {
      const res = await fetch(`${API_BASE}/S/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          start_date: editing.start_date_original,
          end_date: editing.end_date_original,
          payment_status: editing.payment_status,
        }),
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
    try {
      const res = await fetch(`${API_BASE}/S`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

  return (
    <Paper className="subscriptionList" sx={{ p: 2, height: 700, width: "100%", maxWidth: "100%" }} dir="rtl">
      <Box className="subscriptionListHeader">
        <Typography variant="h5" fontWeight={700} gutterBottom>ניהול מנויים</Typography>
        <Filters
          query={query} onQueryChange={setQuery}
          status={status} onStatusChange={setStatus}
          expiresInDays={expiresInDays} onExpiresChange={setExpiresInDays}
          onAdd={() => setAddOpen(true)}
          onReset={() => { setQuery(""); setStatus(""); setExpiresInDays(""); }}
        />
      </Box>

      <SubscriptionsTable
        rows={rows} rowCount={rowCount} loading={loading}
        paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
        sortModel={sortModel} onSortModelChange={setSortModel}
        onEdit={openEdit} onDelete={onDelete}
        onPause={onPause} onResume={onResume} onCancel={onCancel} onRestore={onRestore}
        actionBusyId={actionBusyId}
      />

      <AddDialog API_BASE={API_BASE} open={addOpen} onClose={() => setAddOpen(false)} onCreate={createSubscription} />

      <EditDialog open={editOpen} onClose={() => { setEditOpen(false); setEditError(""); }}
        editing={editing} setEditing={setEditing} onUpdate={updateSubscription} errorMsg={editError} />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
        <Alert onClose={closeSnack} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
