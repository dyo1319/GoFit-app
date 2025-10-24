import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { Close, Print } from "@mui/icons-material";
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE;

async function fetchInvoice(authenticatedFetch, invoiceId) {
  const res = await authenticatedFetch(`/invoices/${invoiceId}`);
  if (!res.ok) throw new Error('טעינת החשבונית נכשלה');
  return res.json();
}

export default function ViewInvoiceDialog({ open, onClose, invoiceId }) {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [invoice, setInvoice] = React.useState(null);

  React.useEffect(() => {
    if (open && invoiceId) {
      loadInvoice();
    }
  }, [open, invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchInvoice(authenticatedFetch, invoiceId);
      setInvoice(data.data);
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת החשבונית');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: "warning", label: "ממתין" },
      paid: { color: "success", label: "שולם" },
      overdue: { color: "error", label: "איחור" },
      cancelled: { color: "default", label: "בוטל" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip color={config.color} label={config.label} />;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>טוען...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography color="error">{error}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>סגור</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!invoice) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      disableEnforceFocus={false}
      disableAutoFocus={false}
      disableRestoreFocus={false}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">חשבונית #{invoice.invoice_number}</Typography>
          <Box>
            <IconButton 
              onClick={handlePrint} 
              size="small" 
              sx={{ mr: 1 }}
              aria-label="הדפס חשבונית"
            >
              <Print />
            </IconButton>
            <IconButton 
              onClick={onClose} 
              size="small"
              aria-label="סגור"
            >
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                פרטי הלקוח
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>שם:</strong> {invoice.username}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>טלפון:</strong> {invoice.phone}
              </Typography>
              {invoice.gender && (
                <Typography variant="body1" gutterBottom>
                  <strong>מין:</strong> {invoice.gender === 'male' ? 'זכר' : 'נקבה'}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                פרטי החשבונית
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>מספר חשבונית:</strong> {invoice.invoice_number}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>תאריך יצירה:</strong> {formatDate(invoice.created_at)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>תאריך פירעון:</strong> {formatDate(invoice.due_date)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1">
                  <strong>סטטוס:</strong>
                </Typography>
                {getStatusChip(invoice.status)}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {invoice.start_date && invoice.end_date && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              פרטי המנוי
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>סוג מנוי:</strong> {invoice.plan_name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>מחיר:</strong> {invoice.price}₪
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>תאריך התחלה:</strong> {formatDate(invoice.start_date)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>תאריך סיום:</strong> {formatDate(invoice.end_date)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>תיאור</TableCell>
                  <TableCell align="center">כמות</TableCell>
                  <TableCell align="center">מחיר יחידה</TableCell>
                  <TableCell align="center">סה״כ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items && invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="center">{item.unit_price}₪</TableCell>
                    <TableCell align="center">{item.total_price}₪</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Typography variant="h6">סיכום החשבונית</Typography>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="left">
                <Typography variant="body1" gutterBottom>
                  סכום בסיס: {invoice.amount}₪
                </Typography>
                <Typography variant="body1" gutterBottom>
                  מס: {invoice.tax_amount}₪
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" color="primary">
                  סה״כ: {invoice.total_amount}₪
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {invoice.notes && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              הערות
            </Typography>
            <Typography variant="body1">
              {invoice.notes}
            </Typography>
          </Paper>
        )}

        {invoice.status === 'paid' && invoice.paid_at && (
          <Paper sx={{ p: 3, mt: 3, bgcolor: '#e8f5e8' }}>
            <Typography variant="h6" gutterBottom color="success.main">
              פרטי תשלום
            </Typography>
            <Typography variant="body1">
              <strong>תאריך תשלום:</strong> {formatDate(invoice.paid_at)}
            </Typography>
            {invoice.payment_method && (
              <Typography variant="body1">
                <strong>אמצעי תשלום:</strong> {invoice.payment_method}
              </Typography>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}

