// Single source of truth for events. Used by the UI AND by the API routes
// (the server reads maxSize from here, never from the browser).
// Source: Plinth_2027_All_Event_Team_Sizes.docx
//
//   minSize / maxSize: team size limits including the leader.
//   maxSize: 1  → solo event (no "join team" option)
//   minSize is shown to users as guidance; maxSize is enforced by the backend.
//
// ⚠️ TODO (OC): the docx gives no upper limit for these, so caps were chosen:
//   Robowars ("2 or more") → max 6
//   Change My Mind, Graffiti Wall ("Open, minimum 1") → max 10

const E = (id, name, club, minSize, maxSize, note) => ({ id, name, club, minSize, maxSize, note });

export const EVENTS = [
  // 1. E-Cell
  E("sharktank", "SharkTank LNM", "E-CELL", 1, 5),
  E("ideathon", "Ideathon LNM", "E-CELL", 1, 4),
  E("speaker_talk", "Speaker Talk", "E-CELL", 1, 1, "Open to attend"),
  E("startup_expo", "Startup Expo", "E-CELL", 1, 1, "Open to attend"),
  E("panel_talk", "Panel Talk", "E-CELL", 1, 1, "Open to attend"),

  // 2. Quizzinga
  E("cryptex", "Cryptex", "QUIZZINGA", 1, 1),
  E("ipl_auction", "IPL Auction", "QUIZZINGA", 3, 3),
  E("brand_wagon", "Brandwagon", "QUIZZINGA", 3, 3),
  E("qbc", "QBC", "QUIZZINGA", 1, 1),

  // 3. Debate Society
  E("mun", "The LNMIIT MUN '27", "DEBATE SOCIETY", 1, 1, "Individual (delegate)"),
  E("change_my_mind", "Change My Mind", "DEBATE SOCIETY", 1, 10),
  E("graffiti_wall", "Graffiti Wall", "DEBATE SOCIETY", 1, 10),

  // 4. Cybros
  E("iupc", "IUPC", "CYBROS", 3, 3),
  E("enigma", "Enigma", "CYBROS", 1, 1),
  E("cp_duels", "CP Duels", "CYBROS", 1, 1, "1 vs 1"),
  E("coding_cascade", "Coding Cascade", "CYBROS", 3, 3),
  E("alice_bob", "Alice, Bob, Go!", "CYBROS", 1, 1, "1 vs 1"),

  // 5. Cipher / LNMHacks 9.0
  E("lnmhacks_hackathon", "LNMHacks 9.0: Hackathon", "CIPHER / LNMHACKS", 1, 4),
  E("ctf", "CTF 4.O", "CIPHER / LNMHACKS", 1, 4),
  E("ctf_bootcamp", "CTF Bootcamp (Web & Crypto Fundamentals)", "CIPHER / LNMHACKS", 1, 1),
  E("smart_contract_security", "Smart Contract Security & Auditing", "CIPHER / LNMHACKS", 1, 1),
  E("defi_deep_dive", "DeFi Deep Dive: Building with Uniswap V4 Hooks", "CIPHER / LNMHACKS", 1, 1),
  E("hack_to_startup", "From Hack to Startup", "CIPHER / LNMHACKS", 1, 1),

  // 6. Finlogue
  E("pm_hackathon", "Product Management Hackathon", "FINLOGUE", 2, 4),
  E("sustainathon", "Sustain-a-thon", "FINLOGUE", 2, 4),
  E("quantai_hackathon", "QuantAI Hackathon", "FINLOGUE", 2, 4),

  // 7. Astronomy Club
  E("brahmaand", "Brahmaand", "ASTRONOMY CLUB", 4, 5),
  E("starpix", "Starpix", "ASTRONOMY CLUB", 1, 1),
  E("astromemia", "Astromemia", "ASTRONOMY CLUB", 1, 1),
  E("dhoomketu", "Dhoomketu", "ASTRONOMY CLUB", 1, 1),
  E("telescope_pointing", "Telescope Pointing Competition", "ASTRONOMY CLUB", 3, 4),
  E("odins_eye", "Odin's Eye", "ASTRONOMY CLUB", 4, 4),

  // 8. Phoenix
  E("robowars", "Robowars", "PHOENIX", 2, 6),
  E("robocup", "RoboCup", "PHOENIX", 2, 4),
  E("roborace", "Roborace (Velocity Vanguards)", "PHOENIX", 2, 4),
  E("moto_boat", "Moto Boat", "PHOENIX", 2, 4),
  E("tech_expo", "LNM Tech Expo", "PHOENIX", 1, 4),
  E("robo_transporter", "Robo Transporter", "PHOENIX", 2, 5),
  E("maze_solver", "Maze Solver", "PHOENIX", 2, 4),
  E("rc_plane", "RC Plane", "PHOENIX", 2, 3),
  E("drone_racing", "Drone Racing", "PHOENIX", 1, 2),
  E("micro_mouse", "Micro Mouse", "PHOENIX", 1, 3),
  E("nitro_racing", "Nitro Racing", "PHOENIX", 2, 6),

  // 9. Esports
  E("valorant", "VALORANT", "ESPORTS", 5, 5),
  E("bgmi", "BGMI", "ESPORTS", 4, 4),
  E("smashkarts", "Smash Karts", "ESPORTS", 4, 4),
  E("clash_royale", "Clash Royale", "ESPORTS", 1, 1),
  E("fifa", "FIFA", "ESPORTS", 1, 1),
  E("free_fire", "Free Fire", "ESPORTS", 4, 4),
];

export function getEventById(id) {
  return EVENTS.find((e) => e.id === id) || null;
}

/** "Solo", "3 members", "2–4 members" */
export function sizeLabel(e) {
  if (!e) return "";
  if (e.note) return e.note;
  if (e.maxSize === 1) return "Solo";
  if (e.minSize === e.maxSize) return `${e.maxSize} members`;
  return `${e.minSize}–${e.maxSize} members`;
}
