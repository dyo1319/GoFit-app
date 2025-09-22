const isDateISO = (s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s);
const isPhoneIL = (p) => /^05\d{8}$/.test(String(p).replace(/[^0-9]/g, ""));

export function validateUserForm(f) {
  const e = {};
  if (!f.username?.trim()) e.username = "שם משתמש הוא שדה חובה";
  if (!f.phone?.trim()) e.phone = "טלפון הוא שדה חובה";
  if (f.phone && !isPhoneIL(f.phone)) e.phone = "מספר טלפון לא תקין (צריך להתחיל ב-05 ולהיות 10 ספרות)";
  if (!f.password) e.password = "סיסמה היא שדה חובה";
  if (f.password && f.password.length < 6) e.password = "סיסמה חייבת להיות לפחות 6 תווים";
  if (!f.birth_date) e.birth_date = "שדה חובה";

  ["birth_date","recorded_at","start_date","end_date"].forEach(k => {
    if (!isDateISO(f[k])) e[k] = "תאריך חייב להיות בפורמט YYYY-MM-DD";
  });

  const hasAnySub = f.start_date || f.end_date || f.payment_status !== "pending";
  if (hasAnySub) {
    if ((f.start_date && !f.end_date) || (!f.start_date && f.end_date))
      e.end_date = "יש למלא תאריך התחלה ותאריך סיום יחד";
    if (f.start_date && f.end_date && f.start_date >= f.end_date)
      e.end_date = "תאריך סיום חייב להיות אחרי תאריך התחלה";
  }

  ["weight","height","body_fat","muscle_mass","circumference"].forEach(k => {
    if (f[k] !== "" && (isNaN(f[k]) || Number(f[k]) <= 0)) e[k] = "ערך לא תקין";
  });

  return e;
}

export function formatFormData(f) {
  const num = (v) => (v === "" ? undefined : Number(v));
  return {
    username: f.username.trim(),
    phone: f.phone.trim().replace(/[^0-9]/g, ""),
    password: f.password,
    birth_date: f.birth_date || undefined,
    role: f.role,
    gender: f.gender,
    weight: num(f.weight),
    height: num(f.height),
    body_fat: num(f.body_fat),
    muscle_mass: num(f.muscle_mass),
    circumference: num(f.circumference),
    recorded_at: f.recorded_at || undefined,
    start_date: f.start_date || undefined,
    end_date: f.end_date || undefined,
    payment_status: f.payment_status || undefined,
  };
}
