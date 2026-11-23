# PLINTH 2027 Registration Portal

Next.js site for PLINTH 2027 participant registration, event teams, and the Campus Ambassador program.
All data is stored in a Google Sheet through a Google Apps Script web app (no database server).

## Pages
| Route | What it does |
|---|---|
| `/` | Landing page with the countdown to Day 1 (22 Jan 2027, IST) |
| `/register` | Participant registration (name, college, phone, email, Aadhaar, referral code) → random PLINTH ID |
| `/teams` | Log in (email + phone) → pick an event → create a team (get a join code) or join one |
| `/ambassador`, `/ambassador-register`, `/ambassador-thankyou` | Campus Ambassador info, application, referral code |

## Environment variables (only these two)
```
PLINTH_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
PLINTH_SCRIPT_SECRET=<secret printed by setup() in Apps Script>
```
Copy `.env.example` to `.env.local` and fill in the values from the OC. Backend setup steps are in [`google-apps-script/SETUP.md`](google-apps-script/SETUP.md).

## Run locally
```bash
npm install
npm run dev            # http://localhost:3000 (or PORT=xxxx npm run dev)
```
To test without the real Google backend:
```bash
npm run mock:backend   # in-memory fake backend; set .env.local to
                       # PLINTH_SCRIPT_URL=http://127.0.0.1:4555  PLINTH_SCRIPT_SECRET=local-dev-secret
```

## Deploy (Vercel)
1. Import the repo, framework: Next.js (build: `npm run build`).
2. Add the two environment variables above (Production).
3. Deploy. Nothing else is required: no ports or URLs are hardcoded.

## Where things live
- `src/lib/events.js`: event list and team sizes (min/max per event)
- `src/app/api/*`: server routes (validate input, then call the Apps Script with the secret)
- `google-apps-script/Code.gs`: backend (sheet tabs, IDs, locking, clash handling)
