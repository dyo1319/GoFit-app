export async function getSubs(API_BASE, {
  paginationModel,
  sortModel,
  query,
  status,
  expiresInDays,
  signal,
}) {
  const page     = (paginationModel?.page ?? 0) + 1; 
  const pageSize = paginationModel?.pageSize ?? 10;

  const sortField = sortModel?.[0]?.field || "end_date";
  const sortDir   = (sortModel?.[0]?.sort || "asc").toLowerCase();
  const sort      = `${sortField}:${sortDir}`;

  const p = new URLSearchParams({ page, pageSize, sort });

  if (query?.trim()) p.set("query", query.trim());
  if (status)        p.set("status", status);
  if (expiresInDays !== "" && expiresInDays != null) p.set("expiresInDays", String(expiresInDays));

  const res = await fetch(`${API_BASE}/S?${p.toString()}`, {
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const msg = `Failed to load subscriptions (${res.status})`;
    throw new Error(msg);
  }

  const j = await res.json().catch(() => ({}));
  const rows  = j?.data?.items ?? j?.data ?? [];
  const total = j?.data?.total ?? j?.total ?? 0;

  return { rows, total };
}

export async function searchUsers(API_BASE, q, signal) {
  const qs = new URLSearchParams({ q });
  const res = await fetch(`${API_BASE}/U/search?${qs.toString()}`, {
    credentials: "include",
    signal,
  });
  if (!res.ok) return [];
  return await res.json().catch(() => []);
}
