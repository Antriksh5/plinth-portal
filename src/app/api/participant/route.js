import { callScript, respond, badRequest, clean } from "../../../lib/plinthScript";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB (Vercel caps request bodies at 4.5 MB)

// Check real file contents, not just the extension the browser claims.
function sniffMime(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
  return null;
}

// POST /api/participant  (multipart/form-data) → registers a person, returns PLINTH ID
export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Invalid form submission. If your file is large, compress it under 2 MB.");
  }

  const name = clean(form.get("name"), 80).replace(/\s+/g, " ");
  const email = clean(form.get("email"), 120).toLowerCase();
  const phone = clean(form.get("phone"), 20).replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  const college = clean(form.get("college"), 150);
  const accommodation = form.get("accommodation") === "true";
  const referral = clean(form.get("referral"), 20).toUpperCase().replace(/\s+/g, "");
  const file = form.get("aadhar");

  if (name.length < 2) return badRequest("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest("Please enter a valid email.");
  if (!/^[6-9]\d{9}$/.test(phone)) return badRequest("Please enter a valid 10-digit mobile number.");
  if (college.length < 2) return badRequest("Please enter your college name.");
  if (referral && !/^[A-Z]{1,4}\d{4}$/.test(referral)) return badRequest("That referral code doesn't look right (e.g. RIYA4821). Leave it blank if you don't have one.");
  if (!file || typeof file === "string" || file.size === 0) return badRequest("Please upload your Aadhaar card.");
  if (file.size > MAX_FILE_BYTES) return badRequest("Aadhaar file must be under 2 MB.");

  const buf = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffMime(buf);
  if (!mimeType) return badRequest("Aadhaar must be a JPG, PNG or PDF file.");

  const result = await callScript("register", {
    name,
    email,
    phone,
    college,
    accommodation,
    referral,
    aadhar: { mimeType, base64: buf.toString("base64") },
  });
  return respond(result);
}
