import { formatToISODate } from "./dateFormatter";

export const normalizePhone = (raw = "") => String(raw).replace(/\D+/g, "");
export const isPhoneIL = (raw = "") => {
  const p = normalizePhone(raw);
  return /^05\d{8}$/.test(p);
};

export const toISOOrNull = (v) => formatToISODate(v) || null;

export const isValidRange = (start, end) => {
  const s = toISOOrNull(start);
  const e = toISOOrNull(end);
  if (!s || !e) return true; 
  return new Date(s) <= new Date(e);
};

export const isFutureDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

export const isPastDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const validateUserForm = (form) => {
  const errors = {};

  if (!form.username?.trim()) {
    errors.username = "שם משתמש חובה";
  } else if (form.username.trim().length < 2) {
    errors.username = "שם משתמש חייב להכיל לפחות 2 תווים";
  } else if (form.username.trim().length > 50) {
    errors.username = "שם משתמש לא יכול להכיל יותר מ-50 תווים";
  }

  if (!form.phone?.trim()) {
    errors.phone = "טלפון חובה";
  } else if (!isPhoneIL(form.phone)) {
    errors.phone = "מספר טלפון לא תקין (חייב להתחיל ב-05 ולהכיל 10 ספרות)";
  }

  if (!form.password) {
    errors.password = "סיסמה חובה";
  } else if (String(form.password).length < 4) {
    errors.password = "סיסמה חייבת להכיל לפחות 4 תווים";
  } else if (String(form.password).length > 100) {
    errors.password = "סיסמה לא יכולה להכיל יותר מ-100 תווים";
  }

  if (form.birth_date) {
    if (isFutureDate(form.birth_date)) {
      errors.birth_date = "תאריך לידה לא יכול להיות בעתיד";
    }
    
    const birthDate = new Date(form.birth_date);
    const today = new Date();
    const minAgeDate = new Date();
    minAgeDate.setFullYear(today.getFullYear() - 120); 
    
    if (birthDate < minAgeDate) {
      errors.birth_date = "תאריך לידה לא יכול להיות לפני יותר מ-120 שנים";
    }
  }

  if (form.weight && (form.weight < 1 || form.weight > 300)) {
    errors.weight = "משקל חייב להיות בין 1 ל-300 ק״ג";
  }

  if (form.height && (form.height < 50 || form.height > 250)) {
    errors.height = "גובה חייב להיות בין 50 ל-250 ס״מ";
  }

  if (form.body_fat && (form.body_fat < 1 || form.body_fat > 50)) {
    errors.body_fat = "שומן גוף חייב להיות בין 1% ל-50%";
  }

  if (form.muscle_mass && (form.muscle_mass < 1 || form.muscle_mass > 100)) {
    errors.muscle_mass = "מסת שריר חייבת להיות בין 1 ל-100 ק״ג";
  }

  if (form.circumference && (form.circumference < 10 || form.circumference > 200)) {
    errors.circumference = "היקף חייב להיות בין 10 ל-200 ס״מ";
  }

  if (form.start_date || form.end_date) {
    if (!isValidRange(form.start_date, form.end_date)) {
      errors.end_date = "תאריך סיום חייב להיות אחרי תאריך התחלה";
    }
    
    if (form.start_date && isPastDate(form.start_date)) {
      errors.start_date = "תאריך התחלה לא יכול להיות בעבר";
    }
    
    if (form.end_date && isPastDate(form.end_date)) {
      errors.end_date = "תאריך סיום לא יכול להיות בעבר";
    }
  }

  return errors;
};

export const validateField = (name, value, form = {}) => {
  switch (name) {
    case 'username':
      if (!value?.trim()) return "שם משתמש חובה";
      if (value.trim().length < 2) return "שם משתמש חייב להכיל לפחות 2 תווים";
      if (value.trim().length > 50) return "שם משתמש לא יכול להכיל יותר מ-50 תווים";
      return null;
      
    case 'phone':
      if (!value?.trim()) return "טלפון חובה";
      if (!isPhoneIL(value)) return "מספר טלפון לא תקין";
      return null;
      
    case 'password':
      if (!value) return "סיסמה חובה";
      if (String(value).length < 4) return "סיסמה חייבת להכיל לפחות 4 תווים";
      if (String(value).length > 100) return "סיסמה לא יכולה להכיל יותר מ-100 תווים";
      return null;
      
    case 'birth_date':
      if (value && isFutureDate(value)) return "תאריך לידה לא יכול להיות בעתיד";
      return null;
      
    default:
      return null;
  }
};