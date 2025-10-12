import * as React from "react";
import { Paper, Box, Typography, Button, Chip, TextField, InputAdornment } from "@mui/material";
import { Check, Close, Search } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useDebouncedValue } from "../subscription/hook";
import "./pendingpay.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function updatePaymentStatus(id, status) {
  const res = await fetch(`${API_BASE}/S/${id}/payment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("update failed");
}

async function fetchPending({ page, pageSize, sort, q, signal }) {
  const params = {
    page,
    pageSize,
    sort: sort || "end_date:asc",
    payment_status: "pending",
    query: q || "",
  };
  const p = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/S?${p}`, { credentials: "include", signal });
  if (!res.ok) return { rows: [], total: 0 };
  const out = await res.json();
  return { rows: out.rows ?? out.data ?? [], total: out.total ?? 0 };
}

export default function PendingPaymentsPage() {
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
    if (loadingRef.current) return;
    if (abortPrevious) ctrlRef.current?.abort();

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    loadingRef.current = true;
    if (mountedRef.current) setLoading(true);

    const sort = sortModel.length ? `${sortModel[0].field}:${sortModel[0].sort}` : "";
    try {
      const { rows, total } = await fetchPending({
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
  }, [paginationModel, sortModel, qDeb]);

  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (paginationModel.page !== 0) setPaginationModel(prev => ({ ...prev, page: 0 }));
    else load(false);
    return () => ctrlRef.current?.abort();
  }, [qDeb, load]);

  React.useEffect(() => {
    if (!mountedRef.current) return;
    load(true);
  }, [paginationModel.page, paginationModel.pageSize, sortModel, load]);

  React.useEffect(() => {
    if (mountedRef.current) load(true);
  }, []);

  const onMark = async (id, status) => {
    try {
      await updatePaymentStatus(id, status);
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
      renderCell: (p) => (
        <div className="actions-container">
          <Button size="small" variant="contained" startIcon={<Check />} onClick={() => onMark(p.row.id, "paid")}>
            שולם
          </Button>
          <Button size="small" color="error" variant="outlined" startIcon={<Close />} onClick={() => onMark(p.row.id, "failed")}>
            נכשל
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="pendingPage" dir="rtl">
      <Typography className="pendingPage__title" variant="h5">תשלומים בהמתנה</Typography>

      <Box className="pendingFiltersCard">
        <TextField
          size="small"
          value={q}
          onChange={e => setQ(e.target.value)}
          label="חיפוש (שם/טלפון)"
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
        />
      </Paper>
    </div>
  );
}