import { DataGrid } from "@mui/x-data-grid";
import { Chip, Stack, IconButton, Tooltip, Box, Avatar } from "@mui/material";
import { DoneAll, Delete, Visibility, VisibilityOff, Person, AdminPanelSettings } from "@mui/icons-material";

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
  canManage = true,
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
      field: "audience",
      headerName: "סוג",
      flex: 0.6,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isAdminNotification = params.value === 'admin' || params.value === null;
        return (
          <Tooltip title={isAdminNotification ? "התראת מערכת" : "התראה אישית"}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: isAdminNotification ? 'secondary.main' : 'primary.main'
              }}
            >
              {isAdminNotification ? <AdminPanelSettings /> : <Person />}
            </Avatar>
          </Tooltip>
        );
      },
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
              <span style={{ fontSize: '0.75rem' }}>{formatDate(params.value)}</span>
            </>
          ) : (
            <>
              <VisibilityOff fontSize="small" color="disabled" />
              <span style={{ fontSize: '0.75rem' }}>לא נקרא</span>
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
      renderCell: (params) => {
        const canManageThisNotification = canManage && 
          (params.row.audience === 'admin' || 
           params.row.user_id === null || 
           params.row.audience === 'user');

        return (
          <Stack direction="row" spacing={0.5}>
            {canManageThisNotification && !params.row.read_at && (
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
            {canManageThisNotification && (
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
            )}
            {!canManageThisNotification && (
              <Chip 
                size="small" 
                label="אין הרשאות" 
                color="default" 
                variant="outlined" 
              />
            )}
          </Stack>
        );
      },
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
          },
          '& .admin-notification': {
            borderLeft: '4px solid #ed6c02',
          },
          '& .user-notification': {
            borderLeft: '4px solid #1976d2',
          }
        }}
        getRowClassName={(params) => {
          const baseClass = !params.row.read_at ? 'unread-row' : '';
          const notificationType = params.row.audience === 'admin' || params.row.audience === null 
            ? 'admin-notification' 
            : 'user-notification';
          return `${baseClass} ${notificationType}`;
        }}
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