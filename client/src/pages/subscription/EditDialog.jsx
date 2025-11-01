import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, MenuItem, Alert, Button, Typography, IconButton, Divider, FormControl, InputLabel, Select, Chip
} from "@mui/material";
import { Close, Edit } from "@mui/icons-material";
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from "react";

export default function EditDialog({ open, onClose, editing, setEditing, onUpdate, errorMsg }) {
  const { hasPermission, authenticatedFetch } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const canEditSubscriptions = hasPermission('edit_subscriptions');

  useEffect(() => {
    if (open) {
      loadSubscriptionPlans();
    }
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

  const handlePlanChange = (planId) => {
    const selectedPlan = subscriptionPlans.find(plan => plan.id === parseInt(planId));
    if (selectedPlan) {
      setEditing(prev => ({
        ...prev,
        plan_id: planId,
        price: selectedPlan.price,
        plan_type: selectedPlan.plan_type,
        plan_name: selectedPlan.plan_name
      }));
    }
  };

  const handleUpdate = () => {
    if (!canEditSubscriptions) {
      return;
    }
    onUpdate();
  };

  const handleClose = () => {
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
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          margin: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit sx={{ fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            ערוך מנוי
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
        {errorMsg && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              '& .MuiAlert-icon': {
                color: '#ef4444'
              }
            }}
          >
            {errorMsg}
          </Alert>
        )}
        
        {!canEditSubscriptions && (
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
            אין לך הרשאות לערוך מנויים
          </Alert>
        )}
        
        {editing && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box className="enhanced-field-container">
              <Typography className="enhanced-field-label" variant="body2">
                תאריך התחלה
              </Typography>
              <TextField
                type="date"
                id="edit-dialog-start-date"
                name="start_date"
                value={editing.start_date_original}
                onChange={(e) => setEditing({ ...editing, start_date_original: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={!canEditSubscriptions}
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
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
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
                id="edit-dialog-end-date"
                name="end_date"
                value={editing.end_date_original}
                onChange={(e) => setEditing({ ...editing, end_date_original: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={!canEditSubscriptions}
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
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
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
                disabled={!canEditSubscriptions || plansLoading}
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'rgba(248, 250, 252, 0.5)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(248, 250, 252, 0.8)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
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
                  value={
                    // If plan_id exists in subscriptionPlans, use it
                    editing.plan_id && subscriptionPlans.find(p => p.id === parseInt(editing.plan_id)) 
                      ? editing.plan_id 
                      // Otherwise, if plan_type and plan_name exist, show "current"
                      : (editing.plan_type && editing.plan_name ? "current" : "")
                  }
                  onChange={(e) => {
                    if (e.target.value === "") {
                      // Reset plan_id but keep current plan_type, plan_name, price
                      setEditing(prev => ({
                        ...prev,
                        plan_id: null
                      }));
                    } else if (e.target.value === "current") {
                      // Keep current values - no change needed
                    } else {
                      // User selected a new plan
                      handlePlanChange(e.target.value);
                    }
                  }}
                  label="סוג מנוי"
                  renderValue={(value) => {
                    if (value === "current" && editing.plan_name) {
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{editing.plan_name}</Typography>
                          {editing.price !== undefined && editing.price !== null && editing.price !== '' && editing.price !== 0 && (
                            <Chip label={`${editing.price}₪`} size="small" color="primary" variant="outlined" />
                          )}
                          {editing.plan_type && (
                            <Chip 
                              label={editing.plan_type === 'monthly' ? 'חודשי' : 
                                    editing.plan_type === 'quarterly' ? 'רבעוני' :
                                    editing.plan_type === 'yearly' ? 'שנתי' : 'מותאם'} 
                              size="small" 
                              color="secondary" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      );
                    }
                    const selectedPlan = subscriptionPlans.find(p => p.id === parseInt(value));
                    if (selectedPlan) {
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{selectedPlan.plan_name}</Typography>
                          <Chip label={`${selectedPlan.price}₪`} size="small" color="primary" variant="outlined" />
                        </Box>
                      );
                    }
                    return "בחר סוג מנוי";
                  }}
                >
                  {editing.plan_type && editing.plan_name && (
                    <MenuItem value="current">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {editing.plan_name} (נוכחי)
                        </Typography>
                        {editing.price && (
                          <Chip 
                            label={`${editing.price}₪`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                        <Chip 
                          label={editing.plan_type === 'monthly' ? 'חודשי' : 
                                editing.plan_type === 'quarterly' ? 'רבעוני' :
                                editing.plan_type === 'yearly' ? 'שנתי' : 'מותאם'} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  )}
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">בחר סוג מנוי חדש</Typography>
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
                id="edit-dialog-price"
                name="price"
                value={(editing.price !== undefined && editing.price !== null && editing.price !== '') ? editing.price : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditing({ ...editing, price: val === '' ? '' : (val !== '' ? parseFloat(val) || val : '') });
                }}
                InputLabelProps={{ shrink: true }}
                disabled={!canEditSubscriptions}
                placeholder={editing.price !== undefined && editing.price !== null && editing.price !== '' && editing.price !== 0 ? `נוכחי: ${editing.price}₪` : ""}
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
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
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
                id="edit-dialog-payment-status"
                name="payment_status"
                value={editing.payment_status}
                onChange={(e) => setEditing({ ...editing, payment_status: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={!canEditSubscriptions}
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
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
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
        )}
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
          onClick={handleUpdate}
          disabled={!canEditSubscriptions}
          sx={{
            borderRadius: '12px',
            fontWeight: 600,
            textTransform: 'none',
            padding: '10px 20px',
            fontSize: '0.875rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)'
            },
            '&:disabled': {
              backgroundColor: '#9ca3af',
              color: '#ffffff',
              boxShadow: 'none'
            }
          }}
        >
          עדכן
        </Button>
      </DialogActions>
    </Dialog>
  );
}