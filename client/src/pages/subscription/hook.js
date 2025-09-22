import { useEffect, useState } from "react";

/**
 * useDebouncedValue
 * מחזיר ערך "מדובאנס" אחרי delay מילישניות.
 * שימושי למנוע בקשות שרת על כל הקלדה בחיפוש/מסנן.
 *
 * @param {any} value   הערך המקורי (query, expiresInDays וכו')
 * @param {number} delay זמן המתנה במילישניות (ברירת מחדל 300ms)
 * @returns {any} הערך אחרי דיבאונס
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
