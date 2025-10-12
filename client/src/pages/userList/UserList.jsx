import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Paper,Typography, Button, CircularProgress, Alert } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { formatUsersData } from '../../utils/userFormatter';
import './userList.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function DataTable() {
  const navigate = useNavigate();

  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(null);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });

  const fetchUsers = React.useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/U/list?p=${page}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        const formatted = formatUsersData(data.data);
        setRows(formatted);
        setRowCount(Number(data.total_rows ?? 0));
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('שגיאה בטעינת המשתמשים:', err);
      setError('לא ניתן לטעון את רשימת המשתמשים. נסה שוב מאוחר יותר.');
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers(paginationModel.page);
  }, [fetchUsers, paginationModel.page]);

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      return;
    }

    const isLastRowOnPage = rows.length === 1 && paginationModel.page > 0;
    const previousRows = [...rows];
    
    setRows(prev => prev.filter(r => r.id !== id));
    setRowCount(prev => Math.max(0, prev - 1));
    setDeleteLoading(id);

    try {
      const res = await fetch(`${API_BASE}/U/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('מחיקה נכשלה');
      }
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.message || 'מחיקה נכשלה');
      }

      if (isLastRowOnPage) {
        setPaginationModel(p => ({ ...p, page: Math.max(0, p.page - 1) }));
      } else {
        await fetchUsers(paginationModel.page);
      }
      
    } catch (err) {
      console.error('מחיקה נכשלה:', err);
      setRows(previousRows);
      setRowCount(prev => prev + 1);
      setError('מחיקת המשתמש נכשלה. נסה שוב.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const columns = [
    { field: 'id',         headerName: 'מזהה',       flex: 0.5, headerAlign: 'right', align: 'right' },
    { field: 'phone',      headerName: 'טלפון',      flex: 1, headerAlign: 'right', align: 'right' },
    { field: 'username',   headerName: 'שם משתמש',   flex: 1, headerAlign: 'right', align: 'right' },
    { field: 'birth_date', headerName: 'תאריך לידה', flex: 1, headerAlign: 'right', align: 'right' },
    { field: 'role',       headerName: 'תפקיד',      flex: 0.6, headerAlign: 'right', align: 'right' },
    { field: 'gender',     headerName: 'מגדר',       flex: 0.6, headerAlign: 'right', align: 'right' },
    {
      field: 'action',
      headerName: 'פעולות',
      flex: 1,
      headerAlign: 'right',
      align: 'right',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="userActions">
          <Button
            size="small"
            variant="outlined"
            className="userListEdit"
            onClick={(e) => { e.stopPropagation(); navigate(`/user/${params.row.id}`); }}
          >
            ערוך
          </Button>
          <DeleteOutlineIcon
            className="userListDelete"
            onClick={(e) => { e.stopPropagation(); handleDelete(params.row.id); }}
            style={{ 
              opacity: deleteLoading === params.row.id ? 0.5 : 1,
              pointerEvents: deleteLoading === params.row.id ? 'none' : 'auto'
            }}
            disabled={deleteLoading === params.row.id}
          />
          {deleteLoading === params.row.id && (
            <CircularProgress size={16} style={{ marginLeft: '8px' }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="userListContainer">
      <div className="userListHeader">
        <Typography variant="h6" className="userTitle">רשימת משתמשים</Typography>
        <Button 
          variant="contained" 
          className="userAddButton"
          onClick={() => navigate('/newUser')}
        >
          הוסף משתמש
        </Button>
      </div>

      {error && (
        <Alert severity="error" className="errorMessage" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper className="dataGridContainer">
       <DataGrid
          rows={rows}
          getRowId={(row) => row.id}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          className="dataGridRtl"
          sx={{ 
            border: 0,
            '& .MuiDataGrid-row:nth-of-type(odd)': {
              backgroundColor: '#fafafa',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f5f5',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              fontWeight: 600,
            },
          }}
          localeText={{
            noRowsLabel: 'לא נמצאו משתמשים',
            MuiTablePagination: {
              labelRowsPerPage: 'שורות בעמוד:',
              labelDisplayedRows: ({count, page }) => {
                const totalPages = Math.ceil(count / paginationModel.pageSize);
                const currentPage = page + 1;
                return `${currentPage} of ${totalPages}`;
              },
            },
          }}
        />
      </Paper>

      {loading && (
        <div className="loadingOverlay">
          <CircularProgress />
          <span style={{ marginRight: '8px' }}>טוען משתמשים...</span>
        </div>
      )}
    </div>
  );
}