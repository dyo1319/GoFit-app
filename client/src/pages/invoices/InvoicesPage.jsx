import React from "react";
import { Paper, Box, Typography, Button, Chip, TextField, InputAdornment, Alert, IconButton, Tooltip } from "@mui/material";
import { Check, Close, Search, Add, Visibility, Edit } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useDebouncedValue } from "../subscription/hook";
import { useAuth } from '../../context/AuthContext';
import CreateInvoiceDialog from './CreateInvoiceDialog.jsx';
import ViewInvoiceDialog from './ViewInvoiceDialog.jsx';
import "./invoices.css";

const API_BASE = import.meta.env.VITE_API_BASE;

async function updateInvoiceStatus(authenticatedFetch, id, status) {
  const res = await authenticatedFetch(`/invoices/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("העדכון נכשל");
}

async function fetchInvoices(authenticatedFetch, { page, pageSize, sort, q, status, signal }) {
  const params = {
    page,
    pageSize,
    sort: sort || "created_at:desc",
    query: q || "",
    status: status || "",
  };
  const p = new URLSearchParams(params);
  const res = await authenticatedFetch(`/invoices?${p.toString()}`, { signal });
  if (!res.ok) return { rows: [], total: 0 };
  const out = await res.json().catch(() => ({}));
  return { rows: out.data ?? out.rows ?? [], total: out.total ?? 0 };
}

async function createInvoice(authenticatedFetch, invoiceData) {
  const res = await authenticatedFetch('/invoices', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData),
  });
  if (!res.ok) throw new Error("היצירה נכשלה");
  return res.json();
}

export default function InvoicesPage() {
  const { user, hasPermission, authenticatedFetch } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState([{ field: "created_at", sort: "desc" }]);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const qDeb = useDebouncedValue(q, 350);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState(null);

  const ctrlRef = React.useRef();
  const mountedRef = React.useRef(true);
  const loadingRef = React.useRef(false);

  React.useEffect(() => () => {
    mountedRef.current = false;
    ctrlRef.current?.abort();
  }, []);

  const load = React.useCallback(async (abortPrevious = true) => {
    if (!hasPermission('view_invoices')) {
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
      const { rows, total } = await fetchInvoices(authenticatedFetch, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        sort,
        q: qDeb,
        status,
        signal: ctrl.signal,
      });
      if (mountedRef.current && !ctrl.signal.aborted) {
        setRows(rows);
        setRowCount(total);
      }
    } catch (e) {
    } finally {
      loadingRef.current = false;
      if (mountedRef.current && !ctrl.signal.aborted) setLoading(false);
    }
  }, [paginationModel, sortModel, qDeb, status, hasPermission, authenticatedFetch]);

  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (user && hasPermission('view_invoices')) {
      if (paginationModel.page !== 0) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
      } else {
        load(false);
      }
    }
    return () => ctrlRef.current?.abort();
  }, [qDeb, status, user, hasPermission]);

  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (user && hasPermission('view_invoices')) {
      load(true);
    }
  }, [paginationModel.page, paginationModel.pageSize, sortModel, user, hasPermission]);

  const onStatusChange = async (id, newStatus) => {
    if (!hasPermission('edit_invoices')) {
      return;
    }

    try {
      await updateInvoiceStatus(authenticatedFetch, id, newStatus);
      if (mountedRef.current) load(true);
    } catch (e) {
    }
  };

  const onViewInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setViewDialogOpen(true);
  };

  const onCreateInvoice = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    load(true);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: "warning", label: "ממתין" },
      paid: { color: "success", label: "שולם" },
      overdue: { color: "error", label: "איחור" },
      cancelled: { color: "default", label: "בוטל" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  const cols = [
    { field: "id", headerName: "מזהה", flex: 0.5, align: "center", headerAlign: "center" },
    { field: "invoice_number", headerName: "מספר חשבונית", flex: 1, align: "center", headerAlign: "center" },
    { field: "username", headerName: "שם לקוח", flex: 1, align: "center", headerAlign: "center" },
    {
      field: "phone",
      headerName: "טלפון",
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => <span className="phone-number">{p.value}</span>,
    },
    { field: "total_amount", headerName: "סכום", flex: 0.8, align: "center", headerAlign: "center", 
      renderCell: (p) => <span className="amount">₪{p.value}</span> },
    { field: "due_date", headerName: "תאריך פירעון", flex: 1, align: "center", headerAlign: "center" },
    {
      field: "status",
      headerName: "סטטוס",
      flex: 0.8,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => getStatusChip(p.value),
    },
    {
      field: "actions",
      headerName: "פעולות",
      flex: 1.2,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (p) => {
        const canEdit = hasPermission('edit_invoices');
        const canView = hasPermission('view_invoices');
        
        return (
          <div className="actions-container">
            {canView && (
              <Tooltip title="צפייה בחשבונית">
                <IconButton size="small" onClick={() => onViewInvoice(p.row.id)}>
                  <Visibility />
                </IconButton>
              </Tooltip>
            )}
            
            {canEdit && p.row.status === 'pending' && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Check />}
                  onClick={() => onStatusChange(p.row.id, "paid")}
                >
                  שולם
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<Close />}
                  onClick={() => onStatusChange(p.row.id, "cancelled")}
                  sx={{ ml: 1 }}
                >
                  ביטול
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (!user) {
    return (
      <div className="invoicesPage" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography>טוען...</Typography>
        </div>
      </div>
    );
  }

  if (!hasPermission('view_invoices')) {
    return (
      <div className="invoicesPage" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Alert severity="error" sx={{ maxWidth: 400, margin: '0 auto' }}>
            אין לך הרשאות לצפות בחשבוניות
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="invoicesPage" dir="rtl">
      <Box className="invoicesHeader">
        <Typography className="invoicesPage__title" variant="h5">חשבוניות</Typography>
        {hasPermission('create_invoices') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateInvoice}
            className="createInvoiceBtn"
          >
            חשבונית חדשה
          </Button>
        )}
      </Box>

      <Box className="invoicesFiltersCard">
        <Box className="filter-field-container">
          <Typography className="filter-label" variant="body2">
            חיפוש (שם/טלפון/מספר חשבונית)
          </Typography>
          <TextField
            size="small"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="invoicesSearch"
            id="invoices-search"
            name="invoices_search"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Box className="filter-field-container">
          <Typography className="filter-label" variant="body2">
            סטטוס
          </Typography>
          <TextField
            size="small"
            select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="statusFilter"
            SelectProps={{ native: true }}
          >
            <option value="">כל הסטטוסים</option>
            <option value="pending">ממתין</option>
            <option value="paid">שולם</option>
            <option value="overdue">איחור</option>
            <option value="cancelled">בוטל</option>
          </TextField>
        </Box>
      </Box>

      <Paper className="invoicesCard">
        <DataGrid
          className="invoicesGrid"
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

      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ViewInvoiceDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
}
