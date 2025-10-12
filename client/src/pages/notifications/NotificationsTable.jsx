// client/src/notifications/NotificationsTable.jsx
import { DataGrid } from "@mui/x-data-grid";
import { Chip, Stack, IconButton, Tooltip, Box } from "@mui/material";
import { DoneAll, Delete, Visibility, VisibilityOff } from "@mui/icons-material";

const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function NotificationsTable({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
  onMarkRead,
  onDelete,
}) {
  const columns = [
    { 
      field: "id", 
      headerName: "מזהה", 
      flex: 0.5, 
      headerAlign: "center", 
      align: "center",
      renderCell: (params) => (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {params.value}
        </Box>
      ),
    },
    { 
      field: "title", 
      headerName: "כותרת", 
      flex: 1.2, 
      headerAlign: "center", 
      align: "right",
      renderCell: (params) => (
        <Box sx={{ fontWeight: params.row.read_at ? 'normal' : 'bold' }}>
          {params.value}
        </Box>
      ),
    },
    { 
      field: "message", 
      headerName: "תוכן", 
      flex: 2, 
      headerAlign: "center", 
      align: "right",
      renderCell: (params) => (
        <Box 
          sx={{ 
            fontWeight: params.row.read_at ? 'normal' : 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={params.value}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: "type",
      headerName: "סוג",
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const typeConfig = {
          info: { label: "מידע", color: "info" },
          warning: { label: "אזהרה", color: "warning" },
          error: { label: "שגיאה", color: "error" },
          success: { label: "הצלחה", color: "success" },
        };
        
        const config = typeConfig[params.value] || { label: params.value || "—", color: "default" };
        return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
      },
    },
    {
      field: "created_at",
      headerName: "נוצר בתאריך",
      flex: 0.9,
      headerAlign: "center",
      align: "center",
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "read_at",
      headerName: "נקרא",
      flex: 0.7,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {params.value ? (
            <>
              <Visibility fontSize="small" color="success" />
              <span>{formatDate(params.value)}</span>
            </>
          ) : (
            <>
              <VisibilityOff fontSize="small" color="disabled" />
              <span>לא נקרא</span>
            </>
          )}
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "פעולות",
      flex: 0.9,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          {!params.row.read_at && (
            <Tooltip title="סמן כנקרא">
              <IconButton 
                size="small" 
                color="success" 
                onClick={() => onMarkRead(params.row)}
                disabled={loading}
              >
                <DoneAll />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="מחק">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => onDelete(params.row)}
              disabled={loading}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
        rows={rows}
        getRowId={(r) => r.id}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { 
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold'
          },
          '& .MuiDataGrid-row:hover': { backgroundColor: '#fafafa' },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f0f0f0',
          },
          '& .unread-row': {
            backgroundColor: '#f8f9fa',
            fontWeight: '600',
          }
        }}
        getRowClassName={(params) => 
          !params.row.read_at ? 'unread-row' : ''
        }
        localeText={{
          noRowsLabel: "אין התראות להצגה",
          MuiTablePagination: {
            labelRowsPerPage: 'שורות בעמוד:',
            labelDisplayedRows: ({ from, to, count }) =>
              `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ-${to}`}`,
          },
        }}
      />
    </Box>
  );
}