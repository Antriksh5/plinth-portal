# PLINTH Registration + Teams: setup (about 10 minutes)

## 1. Create the backend sheet
1. Create a **new Google Sheet** (e.g. "PLINTH 2027 Registrations") using the **OC's Google account**.
   Aadhaar files are saved to this account's Drive.
2. In the sheet, go to **Extensions → Apps Script**.
3. Delete what's there and paste the full contents of `Code.gs` from this folder. Save.
4. In the function dropdown pick **`setup`** → **Run** → approve the permissions
   (Sheets and Drive only; no emails are sent).
5. Open **View → Logs** (or Execution log) and copy the value after `PLINTH_SCRIPT_SECRET =`.

`setup()` creates the `Participants`, `Teams` and `TeamMembers` tabs (the `Ambassadors` tab is created automatically on the first application), plus a **private** Drive folder for Aadhaar uploads.

## 2. Deploy it as a web app
1. **Deploy → New deployment →** type **Web app**
2. *Execute as:* **Me** · *Who has access:* **Anyone**
   (Safe: every request must carry the secret, and the secret only lives on the Next.js server.)
3. Copy the **Web app URL** (ends in `/exec`).

> If you edit `Code.gs` later: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
> Otherwise the old code keeps running.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables, and `.env.local` for dev)
```
PLINTH_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXXX/exec
PLINTH_SCRIPT_SECRET=<value from step 1.5>
```
Redeploy on Vercel after adding them.

**These two variables are the only ones needed.** Participant registration, teams AND the campus ambassador form all use
this one backend. No other environment variables are needed.
There are no hardcoded ports or URLs: Next.js uses `PORT` (default 3000), and the backend URL comes only from `PLINTH_SCRIPT_URL`.

## Updating an existing deployment
Paste the new `Code.gs`, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (same URL).
If a tab's columns changed (e.g. `Participants` lost `DayPass`) and it still has old test rows, the site shows
*"The Participants tab has old columns…"*. Delete those test rows (or the whole tab) and it fixes itself.

## 4. Before going live
- Team sizes are set from the OC docx in `src/lib/events.js` (`minSize`/`maxSize`, where max 1 = solo). Confirm the 3 marked TODO caps (Robowars, Change My Mind, Graffiti Wall).
  Changing it only affects **new** teams. For an existing team, edit its `MaxSize` cell in the `Teams` tab.
- Register yourself once, create a team, then join it from another email to confirm everything works.

## How clashes are handled
| Situation | What happens |
|---|---|
| Many people register at the same moment | IDs are random (e.g. PLINTH48213, so they don't reveal how many registered) and assigned under a script lock, so they're always unique |
| Organiser deletes a row in the sheet | IDs are never reused (a counter is kept in Script Properties) |
| Same email **or** phone registers again | Rejected and told to log in with the same email + phone |
| Same email **and** phone (network retry, double click) | Gets back their **existing** ID, no duplicate row |
| Two people grab the last spot in a team | Only one gets it; the other sees "Team is full" and the list refreshes |
| Same team name twice in an event | Rejected (case- and space-insensitive); the same name in a different event is fine |
| Person tries to join 2 teams in one event | Rejected |
| Stranger tries to join a team | Needs the 6-character join code that only the leader sees |
| Server busy (lock not acquired within 25s) | User sees "try again in a few seconds"; nothing is half-written |
| Fake/oversized Aadhaar file | Checked by file contents (JPG/PNG/PDF only), 2 MB max |
| Names like `=HYPERLINK(...)` | Escaped so the sheet never runs them as formulas |

## Limits to know
- **Aadhaar storage**: files go to the Drive of the account that ran `setup()` (15 GB on free Gmail, shared with Gmail/Photos).
  At 2 MB max per file, that's roughly 7,000+ uploads; typical files are much smaller.
- **No emails are sent.** Participants see their PLINTH ID on screen. Later they log in with their email **and** phone,
  which shows the ID again. Campus ambassadors see their referral code on screen; re-submitting the form with the
  same email + phone shows it again.
- **Throughput**: Apps Script takes about 1–3 s per request and serialises writes. That's fine for a few thousand registrations
  spread over days. A big spike (hundreds within the same minute) will get some "try again" messages, but no corrupted data.

## Where the data is
- `Participants`: PlinthID, Name, Email, Phone, College, Accommodation, Referral, AadharFileUrl, RegisteredAt
  (`Referral` must be a valid ambassador code, so you can count registrations per ambassador with a pivot table)
- `Teams`: TeamID, TeamName, EventID, EventName, LeaderPlinthID, JoinCode, MaxSize, CreatedAt
- `TeamMembers`: TeamID, EventID, PlinthID, Role, JoinedAt (one row per person per event)
- `Ambassadors`: Name, Email, Phone, College, AppliedAt, ReferralCode (one application per email / phone)

To remove someone from a team, delete their row in `TeamMembers`.

## Local testing without Google (optional)
```bash
npm run mock:backend          # fake backend in memory (port: MOCK_PORT, default 4555)
# .env.local → PLINTH_SCRIPT_URL=http://127.0.0.1:4555  PLINTH_SCRIPT_SECRET=local-dev-secret
npm run dev
```
