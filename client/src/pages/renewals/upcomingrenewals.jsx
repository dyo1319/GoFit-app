import * as React from "react";
import { Paper, Box, Typography, TextField, InputAdornment, Chip } from "@mui/material";
import { Search } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { getSubs } from "../../pages/newUser/userApiService";        
import { useDebouncedValue } from "../../pages/subscription/hook"; 
import "./renewals.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function UpcomingRenewalsPage() {
  const [query, setQuery] = React.useState("");
  const [expiresInDays, setExpiresInDays] = React.useState(7);
  const qDebounced = useDebouncedValue(query, 350);
  const expDebounced = useDebouncedValue(expiresInDays, 350);
  const [rows, setRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState([{ field: "end_date", sort: "asc" }]);
  const ctrlRef = React.useRef(null);

  const PAYMENT_STATUS_MAP = {
    paid: ["שולם", "success"],
    failed: ["נכשל", "error"],
    refunded: ["הוחזר", "info"],
    pending: ["ממתין", "warning"]
  };

  const fetchData = React.useCallback(async () => {
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true);
    try {
      const { rows, total } = await getSubs(API_BASE, {
        paginationModel,
        sortModel,
        query: qDebounced,
        status: "active",            
        expiresInDays: expDebounced,  
        signal: ctrl.signal,
      });
      setRows(rows);
      setRowCount(total);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to fetch data:', error);
      }
      setRows([]); 
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, qDebounced, expDebounced]);

  React.useEffect(() => { 
    fetchData(); 
    return () => ctrlRef.current?.abort(); 
  }, [fetchData]);

  React.useEffect(() => { 
    setPaginationModel((p) => ({ ...p, page: 0 })); 
  }, [qDebounced, expDebounced]);

  const handleExpiresInDaysChange = (e) => {
    const v = e.target.value;
    if (v === "" || /^\d+$/.test(v)) {
      const numValue = v === "" ? 0 : Math.min(365, Math.max(0, Number(v)));
      setExpiresInDays(numValue);
    }
  };

  const columns = [
    { field: "id", headerName: "מזהה", flex: 0.5, headerAlign: "center", align: "center" },
    { field: "username", headerName: "שם", flex: 1, headerAlign: "center", align: "center" },
    { field: "phone", headerName: "טלפון", flex: 1, headerAlign: "center", align: "center" },
    { field: "start_date", headerName: "מתאריך", flex: 1, headerAlign: "center", align: "center" },
    { field: "end_date", headerName: "עד תאריך", flex: 1, headerAlign: "center", align: "center" },
    {
      field: "days_left",
      headerName: "ימים שנותרו",
      flex: 0.7,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (p) => (p.value == null ? "—" : p.value),
    },
    {
      field: "payment_status",
      headerName: "תשלום",
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      renderCell: (p) => {
        const [label, color] = PAYMENT_STATUS_MAP[p.value] || [p.value || "—", "default"];
        return <Chip size="small" label={label} color={color} />;
      },
    },
  ];

  return (
    <Paper className="renewals" dir="rtl">
      <Box className="renewalsHeader">
        <Typography variant="h5" fontWeight={700}>חידושים קרובים</Typography>
        </Box>
      <Box className="renewalsHeader">
        <Box className="renewalsFilters">
          <TextField
            size="small"
            label="חיפוש (שם/טלפון)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="searchField"
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <Search/>
                </InputAdornment>
              ) 
            }}
          />
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 0, max: 365 }}
            label="ב־כמה ימים קדימה"
            value={expiresInDays}
            onChange={handleExpiresInDaysChange}
            className="daysField"
          />
          <Chip 
            label={`מציג חידושים ב־${expDebounced || 0} ימים הקרובים`} 
            color="info" 
            variant="outlined" 
          />
        </Box>
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
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        className="renewalsGrid"
      />
    </Paper>
  );
}