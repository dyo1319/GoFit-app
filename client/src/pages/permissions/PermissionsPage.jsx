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
        disableAutoFocus={true}
        disableRestoreFocus={false}
        disableScrollLock={false}
        hideBackdrop={false}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: 'blur(10px)',
            maxWidth: '700px',
            width: '90%',
            direction: 'rtl',
            textAlign: 'right'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{
          padding: '24px 24px 16px',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'white',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '12px 12px 0 0',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          direction: 'rtl',
          textAlign: 'right',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '12px 12px 0 0'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row-reverse' }}>
            <EditIcon sx={{ fontSize: '1.5rem' }} />
            עריכת גישה – {selected?.username}
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          padding: '24px',
          backgroundColor: '#ffffff',
          direction: 'rtl'
        }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={3} className="perm-form-row">
              <FormControl className="perm-field" sx={{ flex: 1 }}>
                <InputLabel 
                  id="role-label"
                  sx={{
                    position: 'static',
                    transform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    textAlign: 'right',
                    direction: 'rtl'
                  }}
                >
                  תפקיד
                </InputLabel>
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
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      display: 'none'
                    },
                    '& .MuiSelect-select': {
                      textAlign: 'right',
                      direction: 'rtl',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      transition: 'all 0.3s ease',
                      '&:focus': {
                        backgroundColor: '#ffffff',
                        borderColor: '#6366f1',
                        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        borderColor: 'rgba(99, 102, 241, 0.3)'
                      }
                    },
                    '& .MuiSelect-icon': {
                      right: 'auto !important',
                      left: '12px !important',
                      color: '#6366f1'
                    }
                  }}
                >
                  <MenuItem value="admin">{ROLE_LABEL.admin}</MenuItem>
                  <MenuItem value="trainer">{ROLE_LABEL.trainer}</MenuItem>
                </Select>
              </FormControl>

              <FormControl className="perm-field" sx={{ flex: 1 }}>
                <InputLabel 
                  id="profile-label"
                  sx={{
                    position: 'static',
                    transform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    textAlign: 'right',
                    direction: 'rtl'
                  }}
                >
                  פרופיל גישה
                </InputLabel>
                <Select
                  labelId="profile-label"
                  id="access-profile-select"
                  name="access_profile"
                  value={profile}
                  label="פרופיל גישה"
                  onChange={(e) => setProfile(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      display: 'none'
                    },
                    '& .MuiSelect-select': {
                      textAlign: 'right',
                      direction: 'rtl',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      transition: 'all 0.3s ease',
                      '&:focus': {
                        backgroundColor: '#ffffff',
                        borderColor: '#6366f1',
                        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        borderColor: 'rgba(99, 102, 241, 0.3)'
                      }
                    },
                    '& .MuiSelect-icon': {
                      right: 'auto !important',
                      left: '12px !important',
                      color: '#6366f1'
                    }
                  }}
                >
                  <MenuItem value="default">{PROFILE_LABEL.default}</MenuItem>
                  <MenuItem value="readonly">{PROFILE_LABEL.readonly}</MenuItem>
                  <MenuItem value="custom">{PROFILE_LABEL.custom}</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {profile === "custom" && (
              <Box sx={{
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#6366f1',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.1)'
                }
              }}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  fontWeight: 600, 
                  color: '#374151',
                  textAlign: 'right',
                  direction: 'rtl'
                }}>
                  הרשאות מותאמות אישית
                </Typography>
                <PermissionsChecklist
                  selected={customPerms}
                  onChange={handlePermissionsChange}
                  disabled={false}
                  compact={false}
                />
              </Box>
            )}

            <Divider sx={{ 
              borderColor: '#e2e8f0',
              borderWidth: '1px',
              margin: '16px 0'
            }} />

            <Box sx={{
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#9ca3af',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)'
              }
            }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                fontWeight: 600, 
                color: '#374151',
                textAlign: 'right',
                direction: 'rtl',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexDirection: 'row-reverse'
              }}>
                <Box sx={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                }} />
                הרשאות אפקטיביות – {ROLE_LABEL[role]} / {PROFILE_LABEL[profile]}
              </Typography>
              {effective.length === 0 ? (
                <Typography 
                  color="text.secondary" 
                  sx={{ 
                    textAlign: 'right',
                    direction: 'rtl',
                    fontStyle: 'italic'
                  }}
                >
                  אין הרשאות מוצגות.
                </Typography>
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(248, 250, 252, 0.5)'
                }}>
                  {effective.map((k) => (
                    <Chip 
                      key={k} 
                      label={k} 
                      size="small" 
                      sx={{
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 3,
          backgroundColor: 'rgba(248, 250, 252, 0.5)',
          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          direction: 'rtl',
          justifyContent: 'flex-start',
          gap: 2
        }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.875rem',
              border: '2px solid #e2e8f0',
              color: '#64748b',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#6366f1',
                color: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={onSave}
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #047857)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
              }
            }}
          >
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}