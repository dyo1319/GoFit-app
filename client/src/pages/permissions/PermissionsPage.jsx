import * as React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Paper, Box, Typography, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, Select,
  InputLabel, MenuItem, Chip, Stack, Divider, TextField, InputAdornment
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid } from "@mui/x-data-grid";
import PermissionsChecklist from "./PermissionsChecklist";
import "./permissions.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const ROLE_LABEL = { admin: "מנהל", trainer: "מאמן" };
const PROFILE_LABEL = { 
  default: "ברירת מחדל", 
  readonly: "קריאה בלבד", 
  custom: "מותאם אישית" 
};

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

export default function PermissionsPage() {
  const { authenticatedFetch } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [filteredRows, setFilteredRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const [catalog, setCatalog] = React.useState([]); 
  const [presets, setPresets] = React.useState({
    admin: { preset: [], readonly_subset: [] },
    trainer: { preset: [], readonly_subset: [] },
  });

  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null); 

  const [role, setRole] = React.useState("trainer");
  const [profile, setProfile] = React.useState("default");
  const [customPerms, setCustomPerms] = React.useState([]);

  React.useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRows(rows);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = rows.filter(row => 
        row.username?.toLowerCase().includes(term) ||
        row.phone?.includes(searchTerm) 
      );
      setFilteredRows(filtered);
    }
  }, [rows, searchTerm]);

  const effective = React.useMemo(() => {
    if (profile === "custom") return [...customPerms].sort();
    if (profile === "default") return [...(presets[role]?.preset || [])].sort();
    if (profile === "readonly") return [...(presets[role]?.readonly_subset || [])].sort();
    return [];
  }, [profile, role, presets, customPerms]);

  const fetchCatalog = React.useCallback(async () => {
    const res = await authenticatedFetch(`${API_BASE}/rbac/catalog`);
    if (!res.ok) throw new Error("catalog failed");
    const json = await res.json();
    setCatalog(json.items || []);
  }, [authenticatedFetch]);

  const fetchPresetForRole = React.useCallback(async (r) => {
    const res = await authenticatedFetch(`${API_BASE}/rbac/presets/${r}`);
    if (!res.ok) throw new Error("preset failed");
    const json = await res.json();
    setPresets((prev) => ({
      ...prev,
      [r]: {
        preset: json.preset || [],
        readonly_subset: json.readonly_subset || [],
      },
    }));
  }, [authenticatedFetch]);

  const ensurePresetsLoaded = React.useCallback(async (r) => {
    const exists = presets[r] && (presets[r].preset.length || presets[r].readonly_subset.length);
    if (!exists) await fetchPresetForRole(r);
  }, [presets, fetchPresetForRole]);

  const fetchStaff = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/staff`);
      const json = await res.json();
      const staffRows = (json.items || []).map((u) => ({ ...u, id: u.id }));
      setRows(staffRows);
      setFilteredRows(staffRows);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  React.useEffect(() => {
    fetchCatalog();
    Promise.all(["admin", "trainer"].map(fetchPresetForRole)).catch(() => {});
    fetchStaff();
  }, [fetchCatalog, fetchPresetForRole, fetchStaff]);

  const handleOpen = async (row) => {
    setSelected(row);
    setRole(row.role || "trainer");
    setProfile(row.access_profile || "default");
    setCustomPerms(safeArray(row.permissions_json));
    setOpen(true);
    await ensurePresetsLoaded(row.role || "trainer");
  };

  const handleClose = () => { 
    setOpen(false); 
    setSelected(null); 
    setCustomPerms([]);
  };

  const handlePermissionsChange = (newPermissions) => {
    setCustomPerms(newPermissions);
  };

  const onSave = async () => {
    if (!selected) return;

    const body = {};
    if (role !== selected.role) body.role = role;
    if (profile !== selected.access_profile) body.access_profile = profile;

    if (profile === "custom") {
      body.access_profile = "custom";
      body.permissions_json = customPerms;
    }

    if (Object.keys(body).length === 0) {
      handleClose();
      return;
    }

    const res = await authenticatedFetch(`${API_BASE}/staff/${selected.id}/access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("שמירה נכשלה: " + (err.error || res.status));
      return;
    }
    handleClose();
    fetchStaff();
  };

  const columns = [
    { 
      field: "id", 
      headerName: "מזהה", 
      flex: 1,
      headerAlign: 'center',
      align: 'center'
    },
    { 
      field: "username", 
      headerName: "שם", 
      flex: 1,
      minWidth: 50,
      headerAlign: 'center',
      align: 'center'
    },
    { 
      field: "phone", 
      headerName: "טלפון", 
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <span className="phone-number">{params.value}</span>
      )
    },
    {
      field: "role",
      headerName: "תפקיד",
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      renderCell: (p) => (
        <Chip
          label={ROLE_LABEL[p.value] || p.value}
          size="small"
          color={p.value === "admin" ? "primary" : "default"}
        />
      ),
    },
    {
      field: "access_profile",
      headerName: "פרופיל גישה",
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      renderCell: (p) => (
        <Chip
          label={PROFILE_LABEL[p.value] || p.value}
          size="small"
          variant={p.value === "custom" ? "outlined" : "filled"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "פעולות",
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (p) => (
        <IconButton onClick={() => handleOpen(p.row)} aria-label="עריכה" size="small">
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }} dir="rtl" className="perm-page">
      <Paper className="perm-card perm-card--header">
        <Typography variant="h6" fontWeight={800}>צוות והרשאות</Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchStaff}>רענן</Button>
      </Paper>

      <Paper className="perm-filters-card">
        <TextField
          id="permissions_search"
          name="permissions_search"
          className="perm-search"
          placeholder="חפש לפי שם או טלפון"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper className="perm-card">
        <div style={{ height: 540, width: "100%" }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            localeText={{
              noRowsLabel: "אין נתונים",
              footerRowSelected: (c) => `${c} נבחרו`,
              columnMenuLabel: "תפריט",
            }}
          />
        </div>
      </Paper>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="md" 
        dir="rtl"
        disableEnforceFocus={false}
        disableAutoFocus={false}
        disableRestoreFocus={false}
      >
        <DialogTitle>עריכת גישה – {selected?.username}</DialogTitle>
        <DialogContent dividers className="perm-dialog">
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} className="perm-form-row">
              <FormControl className="perm-field">
                <InputLabel id="role-label">תפקיד</InputLabel>
                <Select
                  labelId="role-label"
                  id="staff-role-select"
                  name="staff_role"
                  value={role}
                  label="תפקיד"
                  onChange={async (e) => {
                    const newRole = e.target.value;
                    setRole(newRole);
                    await ensurePresetsLoaded(newRole);
                  }}
                >
                  <MenuItem value="admin">{ROLE_LABEL.admin}</MenuItem>
                  <MenuItem value="trainer">{ROLE_LABEL.trainer}</MenuItem>
                </Select>
              </FormControl>

              <FormControl className="perm-field">
                <InputLabel id="profile-label">פרופיל גישה</InputLabel>
                <Select
                  labelId="profile-label"
                  id="access-profile-select"
                  name="access_profile"
                  value={profile}
                  label="פרופיל גישה"
                  onChange={(e) => setProfile(e.target.value)}
                >
                  <MenuItem value="default">{PROFILE_LABEL.default}</MenuItem>
                  <MenuItem value="readonly">{PROFILE_LABEL.readonly}</MenuItem>
                  <MenuItem value="custom">{PROFILE_LABEL.custom}</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {profile === "custom" && (
              <Box className="perm-custom-box">
                <PermissionsChecklist
                  selected={customPerms}
                  onChange={handlePermissionsChange}
                  disabled={false}
                  compact={false}
                />
              </Box>
            )}

            <Divider />

            <Box className="perm-effective">
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                הרשאות אפקטיביות – {ROLE_LABEL[role]} / {PROFILE_LABEL[profile]}
              </Typography>
              {effective.length === 0 ? (
                <Typography color="text.secondary">אין הרשאות מוצגות.</Typography>
              ) : (
                <Box className="perm-chips-wrap">
                  {effective.map((k) => (
                    <Chip key={k} label={k} size="small" className="perm-chip" />
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>ביטול</Button>
          <Button variant="contained" onClick={onSave}>שמור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}