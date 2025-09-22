import { DataGrid } from "@mui/x-data-grid";
import { Chip, Stack, IconButton, Button } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";


export default function SubscriptionsTable({
  rows, rowCount, loading,
  paginationModel, onPaginationModelChange,
  sortModel, onSortModelChange,
  onEdit, onDelete, onPause, onResume, onCancel, onRestore,
  actionBusyId,
}) {
  const columns = [
    { field: "id", headerName: "מזהה", flex: 0.6, headerAlign: "center", align: "center" },
    { field: "username", headerName: "שם", flex: 1, headerAlign: "center", align: "center" },
    { field: "phone", headerName: "טלפון", flex: 1, headerAlign: "center", align: "center" },
    { field: "start_date", headerName: "מתאריך", flex: 1, headerAlign: "center", align: "center" },
    { field: "end_date", headerName: "עד תאריך", flex: 1, headerAlign: "center", align: "center" },
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
            <IconButton size="small" color="primary" onClick={() => onEdit(params.row)}>
              <Edit />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(params.row)}
              disabled={busy(`/S/${id}`)}
            >
              <Delete />
            </IconButton>
            {st === "active" && (
              <Button
                size="small"
                variant="outlined"
                disabled={busy(`/S/${id}/pause`)}
                onClick={() => onPause(params.row)}
              >
                הקפא
              </Button>
            )}
            {st === "paused" && (
              <Button
                size="small"
                variant="outlined"
                disabled={busy(`/S/${id}/resume`)}
                onClick={() => onResume(params.row)}
              >
                חידוש מהקפאה
              </Button>
            )}
            {st !== "canceled" && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={busy(`/S/${id}/cancel`)}
                onClick={() => onCancel(params.row)}
              >
                בטל
              </Button>
            )}
            {st === "canceled" && (
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={busy(`/S/${id}/restore`)}
                onClick={() => onRestore(params.row)}
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
        "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
        "& .MuiDataGrid-row:hover": { backgroundColor: "#fafafa" },
        "& .MuiDataGrid-cell": { borderBottom: "1px solid #f0f0f0" },
        "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
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
