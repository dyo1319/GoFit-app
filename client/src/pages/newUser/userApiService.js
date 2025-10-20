const errorMessages = {
  400: "נתונים לא תקינים - אנא בדוק את הפרטים שהזנת",
  401: "נדרשת התחברות מחדש - אנא התחבר שוב",
  403: "גישה נדחתה - אין הרשאות מתאימות",
  404: "שירות אינו זמין - אנא נסה שוב מאוחר יותר",
  409: "משתמש עם פרטים אלו כבר קיים במערכת",
  500: "שגיאת שרת - נסה שוב מאוחר יותר"
};

const createErrorResponse = (status, json = {}, customMessage = null) => ({
  ok: false,
  status,
  json: { 
    ...json, 
    message: customMessage || errorMessages[status] || json?.message || `שגיאה (${status})` 
  }
});

const createSuccessResponse = (status, json) => ({
  ok: true,
  status,
  json
});

const createNetworkErrorResponse = () => ({
  ok: false,
  status: 0,
  json: { message: "שגיאת רשת - נסה שוב או בדוק את החיבור לאינטרנט" }
});

const handlePermissionError = (status, action) => {
  if (status === 403) {
    return `אין לך הרשאות לביצוע ${action}`;
  }
  if (status === 401) {
    return "נדרשת התחברות מחדש - אנא התחבר שוב";
  }
  return null;
};

export async function createUser(API_BASE, payload) {
  try {
    const res = await fetch(`${API_BASE}/U/Add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    
    const json = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const permissionMessage = handlePermissionError(res.status, "יצירת משתמש");
      return createErrorResponse(res.status, json, permissionMessage);
    }
    
    return createSuccessResponse(res.status, json);
  } catch (error) {
    console.error("Network error creating user:", error);
    return createNetworkErrorResponse();
  }
}

export async function searchUsers(API_BASE, q, signal) {
  try {
    const p = new URLSearchParams({ q });
    const res = await fetch(`${API_BASE}/U/search?${p}`, { 
      credentials: "include", 
      signal 
    });
    
    if (!res.ok) {
      if (res.status === 403) {
        console.warn("User doesn't have permission to search users");
        return [];
      }
      return [];
    }
    
    return await res.json().catch(() => []);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Network error searching users:", error);
    }
    return [];
  }
}

export async function getSubs(authenticatedFetch, {
  paginationModel,
  sortModel,
  query,
  status,
  expiresInDays,
  signal,
}) {
  try {
    const page     = (paginationModel?.page ?? 0) + 1; 
    const pageSize = paginationModel?.pageSize ?? 10;

    const sortField = sortModel?.[0]?.field || "end_date";
    const sortDir   = (sortModel?.[0]?.sort || "asc").toLowerCase();
    const sort      = `${sortField}:${sortDir}`;

    const p = new URLSearchParams({ page, pageSize, sort });
    if (query?.trim()) p.set("query", query.trim());
    if (status) p.set("status", status);
    if (expiresInDays !== "" && expiresInDays != null) p.set("expiresInDays", String(expiresInDays));

    const res = await authenticatedFetch(`/S?${p.toString()}`, { signal });

    if (!res.ok) {
      const permissionMessage = handlePermissionError(res.status, "טעינת מנויים");
      const msg = permissionMessage || `Failed to load subscriptions (${res.status})`;
      throw new Error(msg);
    }

    const j = await res.json().catch(() => ({}));
    const rows  = j?.data?.items ?? j?.data ?? [];
    const total = j?.data?.total ?? j?.total ?? 0;

    return { rows, total };
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Error fetching subscriptions:", error);
    }
    throw error;
  }
}

export async function updateUser(API_BASE, userId, payload) {
  try {
    const res = await fetch(`${API_BASE}/U/Update/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    
    const json = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const permissionMessage = handlePermissionError(res.status, "עדכון משתמש");
      return createErrorResponse(res.status, json, permissionMessage);
    }
    
    return createSuccessResponse(res.status, json);
  } catch (error) {
    console.error("Network error updating user:", error);
    return createNetworkErrorResponse();
  }
}

export async function checkUserPermissions(API_BASE) {
  try {
    const res = await fetch(`${API_BASE}/auth/permissions`, {
      credentials: "include",
    });
    
    if (!res.ok) {
      return { hasPermissions: false, permissions: [] };
    }
    
    const data = await res.json();
    return { 
      hasPermissions: true, 
      permissions: data.permissions || [],
      user: data.user 
    };
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return { hasPermissions: false, permissions: [] };
  }
}
