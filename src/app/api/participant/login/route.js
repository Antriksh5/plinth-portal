import { callScript, respond, badRequest, readJson, clean } from "../../../../lib/plinthScript";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/participant/login { email, phone } → participant (incl. PLINTH ID) + their teams
export async function POST(request) {
  const body = await readJson(request);
  const email = clean(body?.email, 120).toLowerCase();
  // Session refresh from a device that already logged in: { plinthId, email }
  const plinthId = clean(body?.plinthId, 20).toUpperCase();
  if (plinthId) {
    if (!/^PLINTH\d+$/.test(plinthId) || !email) return badRequest("Please log in again.");
    return respond(await callScript("login", { plinthId, email }));
  }
  const phone = clean(body?.phone, 20).replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest("Enter the email you registered with.");
  if (!/^\d{10}$/.test(phone)) return badRequest("Enter the 10-digit phone number you registered with.");
  return respond(await callScript("login", { email, phone }));
}
