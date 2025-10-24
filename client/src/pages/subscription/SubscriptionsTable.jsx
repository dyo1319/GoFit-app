import { DataGrid } from "@mui/x-data-grid";
import { Chip, Stack, IconButton, Button } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useAuth } from '../../context/AuthContext';
import { formatToHebrewDate } from '../../utils/dateFormatter';

export default function SubscriptionsTable({
  rows, rowCount, loading,
  paginationModel, onPaginationModelChange,
  sortModel, onSortModelChange,
  onEdit, onDelete, onPause, onResume, onCancel, onRestore,
  actionBusyId,
  canEdit = true,
  canDelete = true,
  canManage = true,
}) {
  const { hasPermission } = useAuth();

  const canEditSubs = canEdit && hasPermission('edit_subscriptions');
  const canDeleteSubs = canDelete && hasPermission('delete_subscriptions');
  const canManageSubs = canManage && hasPermission('manage_subscriptions');

  const columns = [
    { field: "id", headerName: "מזהה", flex: 0.6, headerAlign: "center", align: "center" },
    { field: "username", headerName: "שם", flex: 1, headerAlign: "center", align: "center" },
    { field: "phone", headerName: "טלפון", flex: 1, headerAlign: "center", align: "center" },
    { 
      field: "start_date", 
      headerName: "מתאריך", 
      flex: 1, 
      headerAlign: "center", 
      align: "center",
      renderCell: (params) => formatToHebrewDate(params.value, "—")
    },
    { 
      field: "end_date", 
      headerName: "עד תאריך", 
      flex: 1, 
      headerAlign: "center", 
      align: "center",
      renderCell: (params) => formatToHebrewDate(params.value, "—")
    },
    {
      field: "days_left",
      headerName: "ימים שנותרו",
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (p) => (p.value == null ? "—" : p.value),
    },
    {
      field: "payment_status",
      headerName: "תשלום",
      flex: 0.9,
      headerAlign: "center",
      align: "center",
      renderCell: (p) => {
        const map = {
          paid: ["שולם", "success"],
          failed: ["נכשל", "error"],
          refunded: ["הוחזר", "info"],
          pending: ["ממתין", "warning"],
        };
        const [label, color] = map[p.value] || [p.value || "—", "default"];
        return <Chip size="small" label={label} color={color} />;
      },
    },
    {
      field: "subscription_status",
      headerName: "סטטוס מנוי",
      flex: 0.9,
      headerAlign: "center",
      align: "center",
      renderCell: (p) => {
        const map = {
          active: ["פעיל", "success"],
          expired: ["פג", "warning"],
          canceled: ["מבוטל", "error"],
          paused: ["מוקפא", "info"],
        };
        const [label, color] = map[p.value] || [p.value || "—", "default"];
        return <Chip size="small" color={color} label={label} />;
      },
    },
    {
      field: "action",
      headerName: "פעולות",
      flex: 1.8,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const st = params.row.subscription_status;
        const id = params.row.id;
        const busy = (key) => actionBusyId === key;
        
        return (
          <Stack direction="row" spacing={1} className="row-actions">
            {canEditSubs && (
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => onEdit(params.row)}
                sx={{
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  color: "#6366f1",
                  "&:hover": {
                    backgroundColor: "rgba(99, 102, 241, 0.2)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(99, 102, 241, 0.3)"
                  }
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
            {canDeleteSubs && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(params.row)}
                disabled={busy(`/S/${id}`)}
                sx={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  "&:hover": {
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(239, 68, 68, 0.3)"
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(156, 163, 175, 0.1)",
                    color: "#9ca3af"
                  }
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
            {canManageSubs && st === "active" && (
              <Button
                size="small"
                variant="outlined"
                disabled={busy(`/S/${id}/pause`)}
                onClick={() => onPause(params.row)}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  borderColor: "#f59e0b",
                  color: "#f59e0b",
                  backgroundColor: "rgba(245, 158, 11, 0.05)",
                  "&:hover": {
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    borderColor: "#d97706",
                    color: "#d97706",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(245, 158, 11, 0.3)"
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(156, 163, 175, 0.05)",
                    borderColor: "#9ca3af",
                    color: "#9ca3af"
                  }
                }}
              >
                הקפא
              </Button>
            )}
            {canManageSubs && st === "paused" && (
              <Button
                size="small"
                variant="outlined"
                disabled={busy(`/S/${id}/resume`)}
                onClick={() => onResume(params.row)}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  borderColor: "#10b981",
                  color: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.05)",
                  "&:hover": {
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderColor: "#059669",
                    color: "#059669",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(16, 185, 129, 0.3)"
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(156, 163, 175, 0.05)",
                    borderColor: "#9ca3af",
                    color: "#9ca3af"
                  }
                }}
              >
                חידוש מהקפאה
              </Button>
            )}
            {canManageSubs && st !== "canceled" && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={busy(`/S/${id}/cancel`)}
                onClick={() => onCancel(params.row)}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  borderColor: "#ef4444",
                  color: "#ef4444",
                  backgroundColor: "rgba(239, 68, 68, 0.05)",
                  "&:hover": {
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderColor: "#dc2626",
                    color: "#dc2626",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(239, 68, 68, 0.3)"
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(156, 163, 175, 0.05)",
                    borderColor: "#9ca3af",
                    color: "#9ca3af"
                  }
                }}
              >
                בטל
              </Button>
            )}
            {canManageSubs && st === "canceled" && (
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={busy(`/S/${id}/restore`)}
                onClick={() => onRestore(params.row)}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #059669, #047857)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(16, 185, 129, 0.4)"
                  },
                  "&:disabled": {
                    backgroundColor: "#9ca3af",
                    color: "#ffffff",
                    boxShadow: "none"
                  }
                }}
              >
                שחזר
              </Button>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <DataGrid
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      loading={loading}
      rowCount={rowCount}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      sortingMode="server"
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      sx={{
        border: 0,
        "& .MuiDataGrid-columnHeaders": { 
          backgroundColor: "transparent",
          background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
          borderBottom: "2px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)"
        },
        "& .MuiDataGrid-row:hover": { 
          backgroundColor: "transparent",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          transition: "all 0.2s ease"
        },
        "& .MuiDataGrid-cell": { 
          borderBottom: "1px solid rgba(229, 231, 235, 0.5)",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#4b5563"
        },
        "& .MuiDataGrid-columnHeaderTitle": { 
          fontWeight: 600,
          color: "#374151",
          fontSize: "0.875rem"
        },
        "& .MuiDataGrid-row:nth-of-type(odd)": {
          backgroundColor: "rgba(248, 250, 252, 0.3)"
        },
        "& .MuiDataGrid-footerContainer": {
          backgroundColor: "rgba(248, 250, 252, 0.8)",
          borderTop: "1px solid #e2e8f0"
        }
      }}
      localeText={{
        noRowsLabel: "לא נמצאו רשומות",
        noResultsOverlayLabel: "לא נמצאו תוצאות",
        errorOverlayDefaultLabel: "אירעה שגיאה.",
        toolbarColumns: "עמודות",
        toolbarColumnsLabel: "בחר עמודות",
        toolbarFilters: "סינון",
        toolbarFiltersLabel: "הצג מסננים",
        toolbarFiltersTooltipHide: "הסתר מסננים",
        toolbarFiltersTooltipShow: "הצג מסננים",
        toolbarQuickFilterPlaceholder: "חיפוש...",
        toolbarExport: "ייצוא",
        toolbarExportLabel: "ייצוא",
        toolbarExportCSV: "ייצא ל-CSV",
        footerRowSelected: (count) =>
          count !== 1 ? `${count.toLocaleString()} שורות נבחרו` : `שורה אחת נבחרה`,
        footerTotalRows: 'סה"כ שורות:',
        footerTotalVisibleRows: (visibleCount, totalCount) =>
          `${visibleCount.toLocaleString()} מתוך ${totalCount.toLocaleString()}`,
      }}
    />
  );
}