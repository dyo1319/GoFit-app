import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Grid,
  Chip
} from "@mui/material";
import { Add, Close, Delete } from "@mui/icons-material";
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE;

async function fetchUsers(authenticatedFetch) {
  const res = await authenticatedFetch('/U?pageSize=1000');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || data.rows || [];
}

async function fetchSubscriptions(authenticatedFetch, userId) {
  if (!userId) return [];
  const res = await authenticatedFetch(`/S?userId=${userId}&pageSize=1000`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || data.rows || [];
}

async function createInvoiceAPI(authenticatedFetch, invoiceData) {
  const res = await authenticatedFetch('/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData)
  });
  if (!res.ok) throw new Error('יצירת החשבונית נכשלה');
  return res.json();
}

export default function CreateInvoiceDialog({ open, onClose, onSuccess }) {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [users, setUsers] = React.useState([]);
  const [subscriptions, setSubscriptions] = React.useState([]);
  
  const [formData, setFormData] = React.useState({
    user_id: '',
    subscription_id: '',
    amount: '',
    tax_amount: '0',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: '', total_price: '' }]
  });

  React.useEffect(() => {
    if (open) {
      loadUsers();
      setFormData({
        user_id: '',
        subscription_id: '',
        amount: '',
        tax_amount: '0',
        due_date: '',
        notes: '',
        items: [{ description: '', quantity: 1, unit_price: '', total_price: '' }]
      });
      setError('');
    }
  }, [open]);

  React.useEffect(() => {
    if (formData.user_id) {
      loadSubscriptions(formData.user_id);
    } else {
      setSubscriptions([]);
    }
  }, [formData.user_id]);

  const loadUsers = async () => {
    try {
      const usersData = await fetchUsers(authenticatedFetch);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadSubscriptions = async (userId) => {
    try {
      const subsData = await fetchSubscriptions(authenticatedFetch, userId);
      setSubscriptions(subsData);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].total_price = (quantity * unitPrice).toFixed(2);
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
    
    const totalAmount = newItems.reduce((sum, item) => {
      return sum + (parseFloat(item.total_price) || 0);
    }, 0);
    setFormData(prev => ({ ...prev, amount: totalAmount.toFixed(2) }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: '', total_price: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
      
      const totalAmount = newItems.reduce((sum, item) => {
        return sum + (parseFloat(item.total_price) || 0);
      }, 0);
      setFormData(prev => ({ ...prev, amount: totalAmount.toFixed(2) }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.user_id) {
        setError('יש לבחור לקוח');
        return;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('יש להזין סכום תקין');
        return;
      }
      if (!formData.due_date) {
        setError('יש להזין תאריך פירעון');
        return;
      }

      const invoiceData = {
        user_id: parseInt(formData.user_id),
        subscription_id: formData.subscription_id ? parseInt(formData.subscription_id) : null,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.tax_amount) || 0,
        due_date: formData.due_date,
        notes: formData.notes,
        items: formData.items.filter(item => item.description && item.unit_price)
      };

      await createInvoiceAPI(authenticatedFetch, invoiceData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'שגיאה ביצירת החשבונית');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = parseFloat(formData.amount) + parseFloat(formData.tax_amount || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">חשבונית חדשה</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>לקוח</InputLabel>
              <Select
                value={formData.user_id}
                onChange={(e) => handleInputChange('user_id', e.target.value)}
                label="לקוח"
              >
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username} - {user.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>מנוי (אופציונלי)</InputLabel>
              <Select
                value={formData.subscription_id}
                onChange={(e) => handleInputChange('subscription_id', e.target.value)}
                label="מנוי (אופציונלי)"
                disabled={!formData.user_id}
              >
                <MenuItem value="">ללא מנוי</MenuItem>
                {subscriptions.map(sub => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.plan_name} - {sub.price}₪
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="תאריך פירעון"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="מס (₪)"
              value={formData.tax_amount}
              onChange={(e) => handleInputChange('tax_amount', e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="הערות"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          פריטי החשבונית
        </Typography>

        {formData.items.map((item, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="תיאור"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="כמות"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="מחיר יחידה (₪)"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="סה״כ (₪)"
                  value={item.total_price}
                  disabled
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Box display="flex" gap={1}>
                  {formData.items.length > 1 && (
                    <IconButton 
                      color="error" 
                      onClick={() => removeItem(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        ))}

        <Button
          startIcon={<Add />}
          onClick={addItem}
          variant="outlined"
          sx={{ mt: 1 }}
        >
          הוסף פריט
        </Button>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">סכום בסיס:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" textAlign="left">
                {formData.amount}₪
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">מס:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" textAlign="left">
                {formData.tax_amount}₪
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">סה״כ:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" textAlign="left" color="primary">
                {totalAmount.toFixed(2)}₪
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          ביטול
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'יוצר...' : 'צור חשבונית'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

