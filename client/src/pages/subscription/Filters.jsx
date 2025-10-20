import { Box, TextField, MenuItem, Button, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";

export default function Filters({
  query, onQueryChange,
  status, onStatusChange,
  expiresInDays, onExpiresChange,
  onAdd, onReset,
  canAdd = true,
}) {
  return (
      <Box
        className="subscriptionFilters rtlFormControl"
        sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}
      >
        <TextField
          size="small"
          label="חיפוש (שם/טלפון)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          sx={{ minWidth: 220 }}
          id="subscription-filter-search"
          name="subscription_filter_search"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

      <TextField
        size="small"
        select
        label="סטטוס"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        sx={{ minWidth: 160 }}
        id="subscription-filter-status"
        name="subscription_filter_status"
      >
        <MenuItem value="">הכול</MenuItem>
        <MenuItem value="active">פעיל</MenuItem>
        <MenuItem value="expired">פג</MenuItem>
        <MenuItem value="canceled">מבוטל</MenuItem>
        <MenuItem value="paused">מוקפא</MenuItem>
      </TextField>

      <TextField
        size="small"
        type="number"
        inputProps={{ min: 0 }}
        label="חידושים ב־(ימים)"
        value={expiresInDays}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^\d+$/.test(v)) onExpiresChange(v);
        }}
        sx={{ minWidth: 160 }}
        id="subscription-filter-expires-days"
        name="subscription_filter_expires_days"
      />

      {canAdd && (
        <Button variant="contained" onClick={onAdd} sx={{ minWidth: 120 }}>
          הוסף מנוי
        </Button>
      )}
      
      <Button variant="contained" onClick={onReset}>
        איפוס מסננים
      </Button>
    </Box>
  );
}