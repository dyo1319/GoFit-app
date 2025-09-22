import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, MenuItem, Alert, Button
} from "@mui/material";


export default function EditDialog({ open, onClose, editing, setEditing, onUpdate, errorMsg }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth className="rtlDialog">
      <DialogTitle>ערוך מנוי</DialogTitle>
      <DialogContent>
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {editing && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="תאריך התחלה" type="date"
              value={editing.start_date_original}
              onChange={(e) => setEditing({ ...editing, start_date_original: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="תאריך סיום" type="date"
              value={editing.end_date_original}
              onChange={(e) => setEditing({ ...editing, end_date_original: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="סטטוס תשלום" select
              value={editing.payment_status}
              onChange={(e) => setEditing({ ...editing, payment_status: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
        <Button variant="contained" onClick={onUpdate}>עדכן</Button>
        <Button onClick={onClose}>ביטול</Button>
      </DialogActions>
    </Dialog>
  );
}
