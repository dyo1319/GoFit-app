import * as React from "react";
import { Paper, Box, Typography, Button, Chip, TextField, InputAdornment, Alert } from "@mui/material";
import { Check, Close, Search } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useDebouncedValue } from "../subscription/hook";
import { useAuth } from '../../context/AuthContext';
import "./pendingpay.css";

const API_BASE = import.meta.env.VITE_API_BASE;

async function updatePaymentStatus(authenticatedFetch, id, status) {
  const res = await authenticatedFetch(`/S/${id}/payment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("update failed");
}

async function fetchPending(authenticatedFetch, { page, pageSize, sort, q, signal }) {
  const params = {
    page,
    pageSize,
    sort: sort || "end_date:asc",
    payment_status: "pending",
    query: q || "",
  };
  const p = new URLSearchParams(params);
  const res = await authenticatedFetch(`/S?${p.toString()}`, { signal });
  if (!res.ok) return { rows: [], total: 0 };
  const out = await res.json().catch(() => ({}));
  return { rows: out.rows ?? out.data ?? out?.data?.items ?? [], total: out.total ?? out?.data?.total ?? 0 };
}

export default function PendingPaymentsPage() {
  const { user, hasPermission, authenticatedFetch } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState([{ field: "end_date", sort: "asc" }]);
  const [q, setQ] = React.useState("");
  const qDeb = useDebouncedValue(q, 350);

  const ctrlRef = React.useRef();
  const mountedRef = React.useRef(true);
  const loadingRef = React.useRef(false);

  React.useEffect(() => () => {
    mountedRef.current = false;
    ctrlRef.current?.abort();
  }, []);

  const load = React.useCallback(async (abortPrevious = true) => {
    if (!hasPermission('view_subscriptions')) {
      setRows([]);
      setRowCount(0);
      return;
    }

    if (loadingRef.current) return;
    if (abortPrevious) ctrlRef.current?.abort();

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    loadingRef.current = true;
    if (mountedRef.current) setLoading(true);

    const sort = sortModel.length ? `${sortModel[0].field}:${sortModel[0].sort}` : "";
    try {
      const { rows, total } = await fetchPending(authenticatedFetch, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        sort,
        q: qDeb,
        signal: ctrl.signal,
      });
      if (mountedRef.current && !ctrl.signal.aborted) {
        setRows(rows);
        setRowCount(total);
      }
    } catch (e) {
      if (e.name !== "AbortError" && mountedRef.current) console.error("Failed to fetch pending payments:", e);
    } finally {
      loadingRef.current = false;
      if (mountedRef.current && !ctrl.signal.aborted) setLoading(false);
    }
  }, [paginationModel, sortModel, qDeb, hasPermission, authenticatedFetch]);

  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (user && hasPermission('view_subscriptions')) {
      if (paginationModel.page !== 0) setPaginationModel(prev => ({ ...prev, page: 0 }));
      else load(false);
    }
    return () => ctrlRef.current?.abort();
  }, [qDeb, load, user, hasPermission, paginationModel.page]);

  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (user && hasPermission('view_subscriptions')) {
      load(true);
    }
  }, [paginationModel.page, paginationModel.pageSize, sortModel, load, user, hasPermission]);

  React.useEffect(() => {
    if (mountedRef.current && user && hasPermission('view_subscriptions')) {
      load(true);
    }
  }, [user, hasPermission, load]);

  const onMark = async (id, status) => {
    if (!hasPermission('manage_payment_status')) {
      console.error("No permission to update payment status");
      return;
    }

    try {
      await updatePaymentStatus(authenticatedFetch, id, status);
      if (mountedRef.current) load(true);
    } catch (e) {
      if (mountedRef.current) console.error("Failed to update payment status:", e);
    }
  };

  const cols = [
    { field: "id", headerName: "מזהה", flex: 0.5, align: "center", headerAlign: "center" },
    { field: "username", headerName: "שם", flex: 1, align: "center", headerAlign: "center" },
    {
      field: "phone",
      headerName: "טלפון",
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => <span className="phone-number">{p.value}</span>,
    },
    { field: "end_date", headerName: "עד תאריך", flex: 1, align: "center", headerAlign: "center" },
    {
      field: "payment_status",
      headerName: "תשלום",
      flex: 0.8,
      align: "center",
      headerAlign: "center",
      renderCell: () => <Chip size="small" color="warning" label="ממתין" />,
    },
    {
      field: "act",
      headerName: "פעולות",
      flex: 1,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (p) => {
        const canManagePayments = hasPermission('manage_payment_status');
        return (
          <div className="actions-container">
            {canManagePayments ? (
              <>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Check />}
                  onClick={() => onMark(p.row.id, "paid")}
                >
                  שולם
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<Close />}
                  onClick={() => onMark(p.row.id, "failed")}
                  sx={{ ml: 1 }}
                >
                  נכשל
                </Button>
              </>
            ) : (
              <Chip size="small" label="אין הרשאות" color="default" variant="outlined" />
            )}
          </div>
        );
      },
    },
  ];

  if (!user) {
    return (
      <div className="pendingPage" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography>טוען...</Typography>
        </div>
      </div>
    );
  }

  if (!hasPermission('view_subscriptions')) {
    return (
      <div className="pendingPage" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Alert severity="error" sx={{ maxWidth: 400, margin: '0 auto' }}>
            אין לך הרשאות לצפות בתשלומים ממתינים
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="pendingPage" dir="rtl">
      <Typography className="pendingPage__title" variant="h5">תשלומים בהמתנה</Typography>

      <Box className="pendingFiltersCard">
        <Box className="filter-field-container">
          <Typography className="filter-label" variant="body2">
            חיפוש (שם/טלפון)
          </Typography>
          <TextField
            size="small"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pendingSearch"
            id="pending-payments-search"
            name="pending_payments_search"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      <Paper className="pendingCard">
        <DataGrid
          className="pendingGrid"
          rows={rows}
          getRowId={r => r.id}
          columns={cols}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "transparent",
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              borderBottom: "2px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "transparent",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              transition: "all 0.2s ease"
            },
            "& .MuiDataGrid-cell": {
              borderRight: "1px solid rgba(226, 232, 240, 0.5)",
              fontSize: "0.875rem",
              fontWeight: 500
            },
            "& .MuiDataGrid-columnHeader": {
              borderRight: "1px solid rgba(226, 232, 240, 0.5)",
              fontSize: "0.875rem",
              fontWeight: 700
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "rgba(248, 250, 252, 0.5)",
              borderTop: "1px solid #e2e8f0"
            }
          }}
        />
      </Paper>
    </div>
  );
}
