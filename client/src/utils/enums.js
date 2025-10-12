export const ROLES = [
  { value: "trainee", labelHe: "מתאמן" },
  { value: "trainer", labelHe: "מאמן" },
  { value: "admin",   labelHe: "מנהל" },
];

export const GENDERS = [
  { value: "male",   labelHe: "זכר"  },
  { value: "female", labelHe: "נקבה" },
];

export const PAYMENT_STATUSES = [
  { value: "pending",  labelHe: "ממתין" },
  { value: "paid",     labelHe: "שולם"  },
  { value: "failed",   labelHe: "נכשל"  },
  { value: "refunded", labelHe: "הוחזר" }, 
];

export const SUBSCRIPTION_STATUS_LABELS = {
  active:   "פעיל",
  expired:  "פג תוקף",
  canceled: "בוטל",
  paused:   "מושהה",
};

export const toSelectOptions = (arr) => arr.map(({ value, labelHe }) => ({ value, label: labelHe }));
