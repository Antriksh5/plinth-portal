import { callScript, respond, badRequest, readJson, clean } from "../../../../lib/plinthScript";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/teams/join { plinthId, email, teamId, joinCode }
export async function POST(request) {
  const body = await readJson(request);
  const plinthId = clean(body?.plinthId, 20).toUpperCase();
  const email = clean(body?.email, 120).toLowerCase();
  const teamId = clean(body?.teamId, 20).toUpperCase();
  const joinCode = clean(body?.joinCode, 12).toUpperCase().replace(/\s+/g, "");

  if (!plinthId || !email) return badRequest("Please log in again.");
  if (!/^TEAM\d+$/.test(teamId)) return badRequest("Pick a team from the list.");
  if (!/^[A-Z0-9]{6}$/.test(joinCode)) return badRequest("Join code is 6 characters. Ask your team leader.");

  return respond(await callScript("joinTeam", { plinthId, email, teamId, joinCode }));
}
