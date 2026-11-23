import { callScript, respond, badRequest, readJson, clean } from "../../../lib/plinthScript";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/ambassador { name, email, contact, college }
// Saved to the "Ambassadors" tab of the same PLINTH Apps Script backend (no separate SHEET2 needed).
export async function POST(request) {
  const body = await readJson(request);
  const name = clean(body?.name, 80).replace(/\s+/g, " ");
  const email = clean(body?.email, 120).toLowerCase();
  const phone = clean(body?.contact, 20).replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  const college = clean(body?.college, 150);

  if (name.length < 2) return badRequest("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest("Please enter a valid email.");
  if (!/^[6-9]\d{9}$/.test(phone)) return badRequest("Please enter a valid 10-digit mobile number.");
  if (college.length < 2) return badRequest("Please enter your college name.");

  return respond(await callScript("ambassador", { name, email, phone, college }));
}
