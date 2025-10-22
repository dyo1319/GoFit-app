import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, MenuItem, Alert, Button
} from "@mui/material";
import { useAuth } from '../../context/AuthContext';

export default function EditDialog({ open, onClose, editing, setEditing, onUpdate, errorMsg }) {
  const { hasPermission } = useAuth();

  const canEditSubscriptions = hasPermission('edit_subscriptions');

  const handleUpdate = () => {
    if (!canEditSubscriptions) {
      return;
    }
    onUpdate();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      className="rtlDialog"
      disableEnforceFocus={false}
      disableAutoFocus={false}
      disableRestoreFocus={false}
    >
      <DialogTitle>ערוך מנוי</DialogTitle>
      <DialogContent>
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        
        {!canEditSubscriptions && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            אין לך הרשאות לערוך מנויים
          </Alert>
        )}
        
        {editing && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="תאריך התחלה" 
              type="date"
              id="edit-dialog-start-date"
              name="start_date"
              value={editing.start_date_original}
              onChange={(e) => setEditing({ ...editing, start_date_original: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={!canEditSubscriptions}
            />
            <TextField
              label="תאריך סיום" 
              type="date"
              id="edit-dialog-end-date"
              name="end_date"
              value={editing.end_date_original}
              onChange={(e) => setEditing({ ...editing, end_date_original: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={!canEditSubscriptions}
            />
            <TextField
              label="סטטוס תשלום" 
              select
              id="edit-dialog-payment-status"
              name="payment_status"
              value={editing.payment_status}
              onChange={(e) => setEditing({ ...editing, payment_status: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={!canEditSubscriptions}
            >
              <MenuItem value="pending">ממתין</MenuItem>
              <MenuItem value="paid">שולם</MenuItem>
              <MenuItem value="failed">נכשל</MenuItem>
              <MenuItem value="refunded">הוחזר</MenuItem>
            </TextField>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          variant="contained" 
          onClick={handleUpdate}
          disabled={!canEditSubscriptions}
        >
          עדכן
        </Button>
        <Button onClick={onClose}>ביטול</Button>
      </DialogActions>
    </Dialog>
  );
}