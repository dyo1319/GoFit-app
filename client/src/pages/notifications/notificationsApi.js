export async function getNotifications(authenticatedFetch, {
  paginationModel,
  query,
  type,
  onlyUnread,
  audience = 'user',
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
  if (audience) params.set("audience", audience);

  try {
    const res = await authenticatedFetch(`/notifications?${params.toString()}`, {
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to load notifications (${res.status})`);
    }

    const data = await res.json();
    
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

export async function getNotificationStats(authenticatedFetch) {
  try {
    const res = await authenticatedFetch(`/notifications/stats`);

    if (!res.ok) {
      throw new Error(`Failed to load notification stats (${res.status})`);
    }

    const data = await res.json();
    return data?.data || {
      total: 0,
      unread: 0,
      info: 0,
      warning: 0,
      error: 0,
      success: 0
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
}

async function doAction(authenticatedFetch, path, method = "POST") {
  try {
    const res = await authenticatedFetch(path, { 
      method,
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

export const markAsRead = (authenticatedFetch, id) => 
  doAction(authenticatedFetch, `/notifications/${id}/read`);

export const deleteOne = (authenticatedFetch, id) => 
  doAction(authenticatedFetch, `/notifications/${id}`, "DELETE");

export const markAllAsRead = (authenticatedFetch) => 
  doAction(authenticatedFetch, `/notifications/read-all`);

export const clearAll = (authenticatedFetch) => 
  doAction(authenticatedFetch, `/notifications`, "DELETE");