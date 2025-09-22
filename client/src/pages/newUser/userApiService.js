export async function createUser(API_BASE, payload) {
  const res = await fetch(`${API_BASE}/U/Add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json?.success !== false, status: res.status, json };
}

export async function searchUsers(API_BASE, q, signal) {
  const p = new URLSearchParams({ q });
  const res = await fetch(`${API_BASE}/U/search?${p}`, { credentials: "include", signal });
  if (!res.ok) return [];
  return await res.json().catch(() => []);
}
