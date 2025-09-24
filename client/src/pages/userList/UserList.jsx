import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Paper, Box, Typography, Button } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import './userList.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function DataTable() {
  const navigate = useNavigate();

  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });

  const fetchUsers = React.useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const url = `${API_BASE}/U/list?p=${page}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setRows(Array.isArray(data.data) ? data.data : []);
        setRowCount(Number(data.total_rows ?? 0));
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('שגיאה בטעינת המשתמשים:', err);
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
    const isLastRowOnPage = rows.length === 1 && paginationModel.page > 0;

    setRows(prev => prev.filter(r => r.id !== id));
    setRowCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch(`${API_BASE}/U/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        await fetchUsers(paginationModel.page);
        return;
      }

      if (isLastRowOnPage) {
        setPaginationModel(p => ({ ...p, page: Math.max(0, p.page - 1) }));
      } else {
        await fetchUsers(paginationModel.page);
      }
    } catch (e) {
      console.error('מחיקה נכשלה:', e);
      await fetchUsers(paginationModel.page);
    }
  };

  const columns = [
    { field: 'id',         headerName: 'מזהה',       flex: 1, headerAlign: 'left', align: 'right' },
    { field: 'phone',      headerName: 'טלפון',      flex: 1, headerAlign: 'left', align: 'right' },
    { field: 'username',   headerName: 'שם משתמש',   flex: 1, headerAlign: 'left', align: 'right' },
    { field: 'birth_date', headerName: 'תאריך לידה', flex: 1, headerAlign: 'left', align: 'right' },
    { field: 'role',       headerName: 'תפקיד',      flex: 1, headerAlign: 'left', align: 'right' },
    { field: 'gender',     headerName: 'מגדר',       flex: 1, headerAlign: 'left', align: 'right' },
    {
      field: 'action',
      headerName: 'פעולות',
      flex: 1,
      headerAlign: 'left',
      align: 'right',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="userActions">
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => { e.stopPropagation(); navigate(`/user/${params.row.id}`); }}
          >
            ערוך
          </Button>
          <DeleteOutlineIcon
            className="userListDelete"
            onClick={(e) => { e.stopPropagation(); handleDelete(params.row.id); }}
          />
        </div>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2, height: 600, width: '80%', maxWidth: '100%' }} dir="rtl">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>רשימת משתמשים</Typography>
        <Button variant="contained" onClick={() => navigate('/newUser')}>הוסף משתמש</Button>
      </Box>

      <DataGrid
        rows={rows}
        getRowId={(row) => row.id}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10]}
        checkboxSelection
        disableRowSelectionOnClick
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
