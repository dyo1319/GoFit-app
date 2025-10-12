// client/src/notifications/notificationsApi.js
export async function getNotifications(API_BASE, {
  paginationModel,
  query,
  type,
  onlyUnread,
  signal,
}) {
  const page = (paginationModel?.page ?? 0) + 1;
  const pageSize = paginationModel?.pageSize ?? 10;

  const params = new URLSearchParams({ 
    page: page.toString(), 
    pageSize: pageSize.toString() 
  });
  
  if (query?.trim()) params.set("query", query.trim());
  if (type) params.set("type", type);
  if (onlyUnread) params.set("onlyUnread", "1");

  try {
    const res = await fetch(`${API_BASE}/notifications?${params.toString()}`, {
      credentials: "include",
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to load notifications (${res.status})`);
    }

    const data = await res.json();
    
    // Handle different response structures
    const rows = data?.data?.items ?? data?.data ?? data?.items ?? [];
    const total = data?.data?.total ?? data?.total ?? data?.pagination?.total ?? 0;
    
    return { rows, total };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
      return { rows: [], total: 0 };
    }
    throw error;
  }
}

async function doAction(API_BASE, path, method = "POST") {
  try {
    const res = await fetch(`${API_BASE}${path}`, { 
      method, 
      credentials: "include" 
    });
    
    if (!res.ok) {
      throw new Error(`Action failed with status: ${res.status}`);
    }
    
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch (error) {
    console.error('Action error:', error);
    return { ok: false, status: 0, json: { error: error.message } };
  }
}

export const markAsRead = (API_BASE, id) => 
  doAction(API_BASE, `/notifications/${id}/read`);

export const deleteOne = (API_BASE, id) => 
  doAction(API_BASE, `/notifications/${id}`, "DELETE");

export const markAllAsRead = (API_BASE) => 
  doAction(API_BASE, `/notifications/read-all`);

export const clearAll = (API_BASE) => 
  doAction(API_BASE, `/notifications`, "DELETE");