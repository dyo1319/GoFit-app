import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, MenuItem, CircularProgress, Button
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { searchUsers } from "./api";


export default function AddDialog({ API_BASE, open, onClose, onCreate }) {
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({ start_date: "", end_date: "", payment_status: "pending" });

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
        const list = await searchUsers(API_BASE, q, ctrl.signal);
        setUserOptions(Array.isArray(list) ? list : []);
      } finally {
        setUserLoading(false);
      }
    }, 250);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [API_BASE, open, userSearch]);

  const canSubmit = !!selectedUser?.id && !!form.start_date && !!form.end_date;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth className="rtlDialog">
      <DialogTitle>הוסף מנוי חדש</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Autocomplete
            options={userOptions}
            loading={userLoading}
            value={selectedUser}
            onChange={(_, v) => setSelectedUser(v)}
            onInputChange={(_, v) => setUserSearch(v)}
            getOptionLabel={(o) => (o?.username ? `${o.username} • ${o.phone ?? ""} • #${o.id}` : "")}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            noOptionsText={userSearch.trim().length < 2 ? "הקלד לפחות 2 תווים…" : "לא נמצאו משתמשים"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="חפש משתמש לפי שם/טלפון"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (<>{userLoading ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>),
                }}
              />
            )}
          />

          <TextField label="תאריך התחלה" type="date"
            value={form.start_date}
            onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField label="תאריך סיום" type="date"
            value={form.end_date}
            onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField label="סטטוס תשלום" select
            value={form.payment_status}
            onChange={(e) => setForm(f => ({ ...f, payment_status: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="pending">ממתין</MenuItem>
            <MenuItem value="paid">שולם</MenuItem>
            <MenuItem value="failed">נכשל</MenuItem>
            <MenuItem value="refunded">הוחזר</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" disabled={!canSubmit}
          onClick={() => onCreate({ user_id: selectedUser.id, ...form })}>
          הוסף
        </Button>
        <Button onClick={onClose}>ביטול</Button>
      </DialogActions>
    </Dialog>
  );
}
