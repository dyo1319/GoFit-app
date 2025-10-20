import { Box, Typography } from "@mui/material";


export default function Workouts() {
  return (
    <Box sx={{ p: 3, pb: 10 }} dir="rtl">
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        האימונים שלי
      </Typography>

      <Box sx={{ p: 3, border: "1px dashed #bbb", borderRadius: 2 }}>
        <Typography color="text.secondary">
          כאן יופיעו האימונים שלך. אפשר להוסיף רשימת אימונים, היסטוריית אימונים,
          ותוכניות אישיות. (Placeholder — בטוח לשימוש מיידי)
        </Typography>
      </Box>
    </Box>
  );
}
