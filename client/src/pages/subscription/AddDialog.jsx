import { useEffect, useRef, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions,
         Box, TextField, MenuItem, CircularProgress, Button, Alert, Typography, IconButton, Divider, FormControl, InputLabel, Select, Chip} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { Close, PersonAdd } from "@mui/icons-material";
import { searchUsers  } from "../newUser/userApiService";
import { useAuth } from '../../context/AuthContext';

export default function AddDialog({ API_BASE, open, onClose, onCreate }) {
  const { hasPermission, authenticatedFetch } = useAuth();
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [form, setForm] = useState({ 
    start_date: "", 
    end_date: "", 
    payment_status: "pending",
    plan_id: "",
    price: "",
    plan_type: "monthly",
    plan_name: "מנוי חודשי"
  });

  const ctrlRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    const t = setTimeout(async () => {
      const q = userSearch.trim();
      if (q.length < 2) { setUserOptions([]); return; }
      setUserLoading(true);
      try {
        const list = await searchUsers(authenticatedFetch, q, ctrl.signal);
        setUserOptions(Array.isArray(list) ? list : []);
      } finally {
        setUserLoading(false);
      }
    }, 250);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [API_BASE, open, userSearch]);

  useEffect(() => {
    if (!open) return;
    loadSubscriptionPlans();
  }, [open]);

  const loadSubscriptionPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await authenticatedFetch('/subscription-plans?active_only=true');
      if (res.ok) {
        const data = await res.json();
        setSubscriptionPlans(data.data || []);
      }
    } catch (err) {
    } finally {
      setPlansLoading(false);
    }
  };

  const canSubmit = !!selectedUser?.id && !!form.start_date && !!form.end_date;
  const canCreate = hasPermission('create_subscriptions');

  const handleCreate = () => {
    if (!canCreate) {
      return;
    }
    onCreate({ user_id: selectedUser.id, ...form });
  };

  const handlePlanChange = (planId) => {
    const selectedPlan = subscriptionPlans.find(plan => plan.id === parseInt(planId));
    if (selectedPlan) {
      setForm(f => ({
        ...f,
        plan_id: planId,
        price: selectedPlan.price,
        plan_type: selectedPlan.plan_type,
        plan_name: selectedPlan.plan_name
      }));
    } else {
      setForm(f => ({
        ...f,
        plan_id: "",
        price: "",
        plan_type: "monthly",
        plan_name: "מנוי חודשי"
      }));
    }
  };

  const handleClose = () => {
    setUserSearch("");
    setUserOptions([]);
    setSelectedUser(null);
    setForm({ 
      start_date: "", 
      end_date: "", 
      payment_status: "pending",
      plan_id: "",
      price: "",
      plan_type: "monthly",
      plan_name: "מנוי חודשי"
    });
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth 
      className="rtlDialog enhanced-dialog"
      disableEnforceFocus={false}
      disableAutoFocus={false}
      disableRestoreFocus={false}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '24px 24px 16px 24px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          margin: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd sx={{ fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            הוסף מנוי חדש
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose}
          sx={{ 
            color: 'white',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.05)'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ padding: '24px', background: '#ffffff' }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {!canCreate && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3, 
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                '& .MuiAlert-icon': {
                  color: '#f59e0b'
                }
              }}
            >
              אין לך הרשאות ליצור מנויים חדשים
            </Alert>
          )}
          
          <Box className="enhanced-field-container">
            <Typography className="enhanced-field-label" variant="body2">
              חפש משתמש לפי שם/טלפון
            </Typography>
            <Autocomplete
              options={userOptions}
              loading={userLoading}
              value={selectedUser}
              onChange={(_, v) => setSelectedUser(v)}
              onInputChange={(_, v) => setUserSearch(v)}
              getOptionLabel={(o) => (o?.username ? `${o.username} • ${o.phone ?? ""} • #${o.id}` : "")}
              isOptionEqualToValue={(o, v) => o?.id === v?.id}
              noOptionsText={userSearch.trim().length < 2 ? "הקלד לפחות 2 תווים…" : "לא נמצאו משתמשים"}
              disabled={!canCreate}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(156, 163, 175, 0.05)',
                    color: '#9ca3af'
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  id="add-dialog-user-search"
                  name="user_search"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (<>{userLoading ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>),
                  }}
                />
              )}
            />
          </Box>

          <Box className="enhanced-field-container">
            <Typography className="enhanced-field-label" variant="body2">
              תאריך התחלה
            </Typography>
            <TextField 
              type="date"
              id="add-dialog-start-date"
              name="start_date"
              value={form.start_date}
              onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={!canCreate}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(156, 163, 175, 0.05)',
                    color: '#9ca3af'
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
            />
          </Box>

          <Box className="enhanced-field-container">
            <Typography className="enhanced-field-label" variant="body2">
              תאריך סיום
            </Typography>
            <TextField 
              type="date"
              id="add-dialog-end-date"
              name="end_date"
              value={form.end_date}
              onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={!canCreate}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(156, 163, 175, 0.05)',
                    color: '#9ca3af'
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
            />
          </Box>

          <Box className="enhanced-field-container">
            <Typography className="enhanced-field-label" variant="body2">
              סוג מנוי
            </Typography>
            <FormControl 
              fullWidth
              disabled={!canCreate || plansLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(156, 163, 175, 0.05)',
                    color: '#9ca3af'
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
            >
              <InputLabel>סוג מנוי</InputLabel>
              <Select
                value={form.plan_id}
                onChange={(e) => handlePlanChange(e.target.value)}
                label="סוג מנוי"
              >
                <MenuItem value="">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">בחר סוג מנוי</Typography>
                  </Box>
                </MenuItem>
                {subscriptionPlans.map(plan => (
                  <MenuItem key={plan.id} value={plan.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>{plan.plan_name}</Typography>
                      <Chip 
                        label={`${plan.price}₪`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        label={plan.plan_type === 'monthly' ? 'חודשי' : 
                              plan.plan_type === 'quarterly' ? 'רבעוני' :
                              plan.plan_type === 'yearly' ? 'שנתי' : 'מותאם'} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className="enhanced-field-container">
            <Typography className="enhanced-field-label" variant="body2">
              מחיר (₪)
            </Typography>
            <TextField 
              type="number"
              id="add-dialog-price"
              name="price"
              value={form.price}
              onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={!canCreate}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(156, 163, 175, 0.05)',
                    color: '#9ca3af'
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
            />
          </Box>

          <Box className="enhanced-field-container">
            <Typography className="enhanced-field-label" variant="body2">
              סטטוס תשלום
            </Typography>
            <TextField 
              select
              id="add-dialog-payment-status"
              name="payment_status"
              value={form.payment_status}
              onChange={(e) => setForm(f => ({ ...f, payment_status: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={!canCreate}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(156, 163, 175, 0.05)',
                    color: '#9ca3af'
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
            >
              <MenuItem value="pending" sx={{ fontSize: '0.875rem' }}>ממתין</MenuItem>
              <MenuItem value="paid" sx={{ fontSize: '0.875rem' }}>שולם</MenuItem>
              <MenuItem value="failed" sx={{ fontSize: '0.875rem' }}>נכשל</MenuItem>
              <MenuItem value="refunded" sx={{ fontSize: '0.875rem' }}>הוחזר</MenuItem>
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      
      <Divider sx={{ borderColor: 'rgba(226, 232, 240, 0.8)' }} />
      
      <DialogActions sx={{ 
        padding: '20px 24px', 
        background: 'rgba(248, 250, 252, 0.5)',
        borderRadius: '0 0 16px 16px',
        gap: 2
      }}>
        <Button 
          variant="outlined"
          onClick={handleClose}
          sx={{
            borderRadius: '12px',
            fontWeight: 600,
            textTransform: 'none',
            padding: '10px 20px',
            fontSize: '0.875rem',
            borderColor: '#e2e8f0',
            color: '#64748b',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              borderColor: '#10b981',
              color: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          ביטול
        </Button>
        <Button 
          variant="contained" 
          disabled={!canSubmit || !canCreate}
          onClick={handleCreate}
          sx={{
            borderRadius: '12px',
            fontWeight: 600,
            textTransform: 'none',
            padding: '10px 20px',
            fontSize: '0.875rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669, #047857)',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
            },
            '&:disabled': {
              backgroundColor: '#9ca3af',
              color: '#ffffff',
              boxShadow: 'none'
            }
          }}
        >
          הוסף
        </Button>
      </DialogActions>
    </Dialog>
  );
}