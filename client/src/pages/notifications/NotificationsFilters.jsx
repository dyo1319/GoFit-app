// client/src/notifications/NotificationsFilters.jsx
import { 
  Box, 
  TextField, 
  MenuItem, 
  Button, 
  FormControlLabel, 
  Checkbox, 
  InputAdornment,
  Stack,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Search, Refresh, DoneAll, DeleteSweep } from "@mui/icons-material";

export default function NotificationsFilters({
  query,
  onQueryChange,
  type,
  onTypeChange,
  onlyUnread,
  onOnlyUnreadChange,
  onRefresh,
  onMarkAll,
  onClearAll,
  loading = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box 
      className="notificationsFilters rtlFormControl"
      sx={{ 
        display: "flex", 
        gap: 2, 
        alignItems: "center", 
        flexWrap: "wrap", 
        mb: 2,
        width: '100%'
      }}
    >
      <Stack 
        direction={isMobile ? "column" : "row"} 
        spacing={2} 
        sx={{ width: '100%', alignItems: isMobile ? 'stretch' : 'center' }}
      >
        {/* Search and Filter Group */}
        <Stack direction={isMobile ? "column" : "row"} spacing={2} sx={{ flex: 1 }}>
          <TextField
            size="small"
            label="חיפוש (כותרת/תוכן)"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            sx={{ minWidth: isMobile ? '100%' : 240 }}
            disabled={loading}
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
            label="סוג" 
            value={type} 
            onChange={(e) => onTypeChange(e.target.value)} 
            sx={{ minWidth: isMobile ? '100%' : 160 }}
            disabled={loading}
          >
            <MenuItem value="">הכול</MenuItem>
            <MenuItem value="info">מידע</MenuItem>
            <MenuItem value="warning">אזהרה</MenuItem>
            <MenuItem value="error">שגיאה</MenuItem>
            <MenuItem value="success">הצלחה</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Checkbox 
                checked={!!onlyUnread} 
                onChange={(e) => onOnlyUnreadChange(e.target.checked)}
                disabled={loading}
              />
            }
            label="הצג רק לא נקראו"
          />
        </Stack>

        {/* Action Buttons Group */}
        <Stack direction={isMobile ? "column" : "row"} spacing={1}>
          <Button 
            variant="outlined" 
            onClick={onRefresh}
            disabled={loading}
            startIcon={<Refresh />}
            size={isMobile ? "medium" : "small"}
          >
            רענון
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={onMarkAll}
            disabled={loading}
            startIcon={<DoneAll />}
            size={isMobile ? "medium" : "small"}
          >
            סמן הכול כנקרא
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={onClearAll}
            disabled={loading}
            startIcon={<DeleteSweep />}
            size={isMobile ? "medium" : "small"}
          >
            נקה הכול
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}