import { Box, TextField, MenuItem, Button, InputAdornment, Typography } from "@mui/material";
import { Search } from "@mui/icons-material";

export default function Filters({
  query, onQueryChange,
  status, onStatusChange,
  expiresInDays, onExpiresChange,
  onAdd, onReset,
  canAdd = true,
}) {
  return (
    <Box className="subscription-filters-grid rtlFormControl">
      <Box className="filters-row">
        <Box className="filter-column">
          <Typography className="filter-label" variant="body2">
            חיפוש (שם/טלפון)
          </Typography>
          <TextField
            size="small"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            sx={{ width: "100%" }}
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
        </Box>

        <Box className="filter-column">
          <Typography className="filter-label" variant="body2">
            סטטוס
          </Typography>
          <TextField
            size="small"
            select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            sx={{ width: "100%" }}
            id="subscription-filter-status"
            name="subscription_filter_status"
          >
            <MenuItem value="">הכול</MenuItem>
            <MenuItem value="active">פעיל</MenuItem>
            <MenuItem value="expired">פג</MenuItem>
            <MenuItem value="canceled">מבוטל</MenuItem>
            <MenuItem value="paused">מוקפא</MenuItem>
          </TextField>
        </Box>
      </Box>

      <Box className="filters-row">
        <Box className="filter-column">
          <Typography className="filter-label" variant="body2">
            חידושים ב־(ימים)
          </Typography>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            value={expiresInDays}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d+$/.test(v)) onExpiresChange(v);
            }}
            sx={{ width: "100%" }}
            id="subscription-filter-expires-days"
            name="subscription_filter_expires_days"
          />
        </Box>

        <Box className="filter-column actions-column">
          {canAdd && (
            <Button variant="contained" onClick={onAdd} className="action-button">
              הוסף מנוי
            </Button>
          )}
          
          <Button variant="outlined" onClick={onReset} className="action-button">
            איפוס מסננים
          </Button>
        </Box>
      </Box>
    </Box>
  );
}