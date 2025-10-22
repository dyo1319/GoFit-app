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
  useTheme,
  Chip
} from "@mui/material";
import { Search, Refresh, DoneAll, DeleteSweep, Notifications } from "@mui/icons-material";

export default function NotificationsFilters({
  query,
  onQueryChange,
  type,
  onTypeChange,
  onlyUnread,
  onOnlyUnreadChange,
  audience,
  onAudienceChange,
  onRefresh,
  onMarkAll,
  onClearAll,
  loading = false,
  canManage = true,
  stats = null,
  userRole = 'user',
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const StatsChip = ({ label, value, color = 'default' }) => (
    <Chip 
      size="small" 
      label={`${label}: ${value}`} 
      color={color}
      variant="outlined"
      sx={{ minWidth: 'auto' }}
    />
  );

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
        {stats && (
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              width: '100%', 
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1
            }}
          >
            <StatsChip label="סה״כ" value={stats.total} />
            <StatsChip 
              label="לא נקראו" 
              value={stats.unread} 
              color={stats.unread > 0 ? "warning" : "default"}
            />
            {stats.info > 0 && <StatsChip label="מידע" value={stats.info} color="info" />}
            {stats.warning > 0 && <StatsChip label="אזהרות" value={stats.warning} color="warning" />}
            {stats.error > 0 && <StatsChip label="שגיאות" value={stats.error} color="error" />}
            {stats.success > 0 && <StatsChip label="הצלחות" value={stats.success} color="success" />}
          </Stack>
        )}

        <Stack direction={isMobile ? "column" : "row"} spacing={2} sx={{ flex: 1 }}>
          <TextField
            id="notifications_search"
            name="notifications_search"
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
            id="notifications_type"
            name="notifications_type"
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

          {userRole === 'admin' && (
            <TextField 
              id="notifications_audience"
              name="notifications_audience"
              size="small" 
              select 
              label="סוג התראות" 
              value={audience} 
              onChange={(e) => onAudienceChange(e.target.value)} 
              sx={{ minWidth: isMobile ? '100%' : 160 }}
              disabled={loading}
            >
              <MenuItem value="user">התראות אישיות</MenuItem>
              <MenuItem value="admin">התראות מערכת</MenuItem>
              <MenuItem value="">כל ההתראות</MenuItem>
            </TextField>
          )}

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
          
          {canManage && (
            <>
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
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}