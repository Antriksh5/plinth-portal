import { callScript, respond, badRequest, readJson, clean } from "../../../lib/plinthScript";
import { getEventById } from "../../../lib/events";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/teams?eventId=robowars → public team list for an event (no join codes, no contact info)
export async function GET(request) {
  const eventId = request.nextUrl.searchParams.get("eventId") || "";
  if (!getEventById(eventId)) return badRequest("Unknown event.");
  return respond(await callScript("listTeams", { eventId }));
}

// POST /api/teams { plinthId, email, eventId, teamName } → create a team (creator = leader)
export async function POST(request) {
  const body = await readJson(request);
  const event = getEventById(clean(body?.eventId, 60));
  if (!event) return badRequest("Unknown event.");

  const plinthId = clean(body?.plinthId, 20).toUpperCase();
  const email = clean(body?.email, 120).toLowerCase();
  // Solo events: auto-name the "team" after the participant.
  const teamName =
    event.maxSize === 1 ? `Solo - ${plinthId}` : clean(body?.teamName, 60).replace(/\s+/g, " ");

  if (!plinthId || !email) return badRequest("Please log in again.");
  if (teamName.length < 2 || teamName.length > 40) return badRequest("Team name must be 2–40 characters.");

  return respond(
    await callScript("createTeam", {
      plinthId,
      email,
      eventId: event.id,
      eventName: event.name,
      maxSize: event.maxSize, // from server config, never trusted from the browser
      teamName,
    })
  );
}
