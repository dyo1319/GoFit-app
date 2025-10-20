export async function doAction(authenticatedFetch, path, method = "POST") {
  const res = await authenticatedFetch(path, {
    method,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export const pauseSub   = (authenticatedFetch, id) => doAction(authenticatedFetch, `/S/${id}/pause`);
export const resumeSub  = (authenticatedFetch, id) => doAction(authenticatedFetch, `/S/${id}/resume`);
export const cancelSub  = (authenticatedFetch, id) => doAction(authenticatedFetch, `/S/${id}/cancel`);
export const restoreSub = (authenticatedFetch, id) => doAction(authenticatedFetch, `/S/${id}/restore`);
export const hardDelete = (authenticatedFetch, id) => doAction(authenticatedFetch, `/S/${id}`, "DELETE");