// Client-side fetch helper. Always resolves to { ok, ...data } or { ok:false, code, message }.
export async function api(url, { method = "GET", json, formData } = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: json ? { "Content-Type": "application/json" } : undefined,
      body: json ? JSON.stringify(json) : formData,
      cache: "no-store",
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        code: data?.code || (res.status === 413 ? "INVALID" : "SERVER"),
        message:
          data?.message ||
          (res.status === 413 ? "File too large. Please upload under 2 MB." : "Something went wrong. Please try again."),
      };
    }
    return data;
  } catch {
    return { ok: false, code: "NETWORK", message: "Network error. Check your connection and try again." };
  }
}
