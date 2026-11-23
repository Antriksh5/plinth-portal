// SERVER ONLY — talks to the Google Apps Script backend.
// (only import this file from app/api route handlers)
import { NextResponse } from "next/server";

const STATUS_BY_CODE = {
  INVALID: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FULL: 409,
  BUSY: 503,
  CONFIG: 500,
  SERVER: 500,
};

export async function callScript(action, payload) {
  const url = process.env.PLINTH_SCRIPT_URL;
  const secret = process.env.PLINTH_SCRIPT_SECRET;
  if (!url || !secret) {
    return { ok: false, code: "CONFIG", message: "Server is not configured (PLINTH_SCRIPT_URL / PLINTH_SCRIPT_SECRET)." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action, payload }),
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error(`[plinth:${action}] non-JSON response`, res.status, text.slice(0, 300));
      return { ok: false, code: "SERVER", message: "Registration server returned an unexpected response. Please try again." };
    }
  } catch (err) {
    console.error(`[plinth:${action}]`, err);
    const timedOut = err?.name === "AbortError";
    return {
      ok: false,
      code: timedOut ? "BUSY" : "SERVER",
      message: timedOut
        ? "The server is taking too long. Please try again — your earlier attempt won't be counted twice."
        : "Could not reach the registration server. Please try again.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function respond(result) {
  if (result?.ok) return NextResponse.json(result);
  const status = STATUS_BY_CODE[result?.code] || 500;
  return NextResponse.json(
    { ok: false, code: result?.code || "SERVER", message: result?.message || "Something went wrong." },
    { status }
  );
}

export function badRequest(message) {
  return NextResponse.json({ ok: false, code: "INVALID", message }, { status: 400 });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const clean = (v, max = 200) => String(v ?? "").trim().slice(0, max);
