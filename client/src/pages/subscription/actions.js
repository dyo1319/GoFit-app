
export async function doAction(API_BASE, path, method = "POST") {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export const pauseSub   = (API_BASE, id) => doAction(API_BASE, `/S/${id}/pause`);
export const resumeSub  = (API_BASE, id) => doAction(API_BASE, `/S/${id}/resume`);
export const cancelSub  = (API_BASE, id) => doAction(API_BASE, `/S/${id}/cancel`);
export const restoreSub = (API_BASE, id) => doAction(API_BASE, `/S/${id}/restore`);
export const hardDelete = (API_BASE, id) => doAction(API_BASE, `/S/${id}`, "DELETE");
