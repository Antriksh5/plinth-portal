/**
 * PLINTH 2027 — Registration + Teams + Campus Ambassador backend (Google Apps Script)
 *
 * Setup: see google-apps-script/SETUP.md
 *
 * Every write runs inside a script-wide lock, so two people hitting the
 * server at the same moment can never:
 *   - receive the same PLINTH ID / Team ID / referral code
 *   - push a team past its max size
 *   - create two teams with the same name in one event
 *   - be in two teams for the same event
 *   - register the same email / phone twice
 */

// ───────────────────────── Config ─────────────────────────

// IDs are RANDOM (not sequential) so they don't reveal how many people registered.
var ID_PREFIX = 'PLINTH';
var ID_DIGITS = 5;         // PLINTH48213  (90,000 possible IDs)
var TEAM_PREFIX = 'TEAM';
var TEAM_DIGITS = 5;       // TEAM30517
var LOCK_WAIT_MS = 25000;
var TZ = 'Asia/Kolkata';
var JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

var SHEETS = {
  PARTICIPANTS: {
    name: 'Participants',
    headers: ['PlinthID', 'Name', 'Email', 'Phone', 'College',
              'Accommodation', 'Referral', 'AadharFileUrl', 'RegisteredAt'],
  },
  TEAMS: {
    name: 'Teams',
    headers: ['TeamID', 'TeamName', 'EventID', 'EventName', 'LeaderPlinthID',
              'JoinCode', 'MaxSize', 'CreatedAt'],
  },
  MEMBERS: {
    name: 'TeamMembers',
    headers: ['TeamID', 'EventID', 'PlinthID', 'Role', 'JoinedAt'],
  },
  AMBASSADORS: {
    name: 'Ambassadors',
    headers: ['Name', 'Email', 'Phone', 'College', 'AppliedAt', 'ReferralCode'],
  },
};

// Column indexes (0-based) — keep in sync with headers above.
var P = { ID: 0, NAME: 1, EMAIL: 2, PHONE: 3, COLLEGE: 4, ACCOM: 5, REF: 6, FILE: 7, AT: 8 };
var T = { ID: 0, NAME: 1, EVENT: 2, EVENT_NAME: 3, LEADER: 4, CODE: 5, MAX: 6, AT: 7 };
var M = { TEAM: 0, EVENT: 1, PID: 2, ROLE: 3, AT: 4 };
var A = { NAME: 0, EMAIL: 1, PHONE: 2, COLLEGE: 3, AT: 4, CODE: 5 };

function props_() { return PropertiesService.getScriptProperties(); }

// ───────────────────────── One-time setup ─────────────────────────

/** Run this ONCE from the Apps Script editor (Run ▶ setup). */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from Extensions → Apps Script inside the Google Sheet.');
  var p = props_();
  p.setProperty('SPREADSHEET_ID', ss.getId());

  Object.keys(SHEETS).forEach(function (k) {
    try { ensureSheet_(ss, SHEETS[k]); } catch (e) { Logger.log('⚠️ ' + (e.message || e)); }
  });

  if (!p.getProperty('AADHAR_FOLDER_ID')) {
    var folder = DriveApp.createFolder('PLINTH 2027 - Aadhaar Uploads (PRIVATE)');
    p.setProperty('AADHAR_FOLDER_ID', folder.getId());
  }
  if (!p.getProperty('SECRET')) {
    p.setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid().slice(0, 8));
  }

  Logger.log('✅ Setup done.');
  Logger.log('PLINTH_SCRIPT_SECRET = ' + p.getProperty('SECRET'));
  Logger.log('Aadhaar folder: https://drive.google.com/drive/folders/' + p.getProperty('AADHAR_FOLDER_ID'));
}

function ensureSheet_(ss, def) {
  var sh = ss.getSheetByName(def.name) || ss.insertSheet(def.name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(def.headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, def.headers.length).setFontWeight('bold');
    // Store everything as plain text: keeps phone numbers / IDs exactly as typed.
    sh.getRange(1, 1, sh.getMaxRows(), def.headers.length).setNumberFormat('@');
  } else {
    var width = Math.max(sh.getLastColumn(), def.headers.length);
    var current = sh.getRange(1, 1, 1, width).getValues()[0].map(function (v) { return String(v).trim(); });
    var expected = def.headers.concat(new Array(width - def.headers.length).fill(''));
    if (current.join('|') !== expected.join('|')) {
      var onlyNewColumnsAdded = def.headers.slice(0, current.filter(String).length).join('|') === current.filter(String).join('|');
      if (sh.getLastRow() === 1 || onlyNewColumnsAdded) {
        // Empty tab, or columns only added at the end → safe to rewrite the header row.
        sh.getRange(1, 1, 1, width).setValues([expected]).setFontWeight('bold');
      } else {
        throw new AppError('CONFIG', 'The "' + def.name + '" tab has old columns and existing rows. ' +
          'Delete the old test rows (or the whole tab) and try again.');
      }
    }
  }
  return sh;
}

function sheet_(def) {
  var id = props_().getProperty('SPREADSHEET_ID');
  if (!id) throw new AppError('CONFIG', 'Backend not set up. Run setup() in Apps Script.');
  var ss = SpreadsheetApp.openById(id);
  var cache = sheet_.cache || (sheet_.cache = {});
  if (!cache[def.name]) cache[def.name] = ensureSheet_(ss, def); // checks headers once per request
  return cache[def.name];
}

/** All data rows (without header), values as trimmed strings. */
function rows_(def) {
  var sh = sheet_(def);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, def.headers.length).getValues().map(function (r) {
    return r.map(function (v) { return String(v).trim(); });
  });
}

function append_(def, row) {
  var sh = sheet_(def);
  var next = sh.getLastRow() + 1;
  var range = sh.getRange(next, 1, 1, row.length);
  range.setNumberFormat('@');
  range.setValues([row.map(safeCell_)]);
}

// ───────────────────────── HTTP entry ─────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var secret = props_().getProperty('SECRET');
    if (!secret || body.secret !== secret) throw new AppError('UNAUTHORIZED', 'Unauthorized');

    var handlers = {
      register: register_,
      login: login_,
      listTeams: listTeams_,
      createTeam: createTeam_,
      joinTeam: joinTeam_,
      ambassador: ambassador_,
    };
    var fn = handlers[body.action];
    if (!fn) throw new AppError('INVALID', 'Unknown action');
    sheet_.cache = {};
    return json_(Object.assign({ ok: true }, fn(body.payload || {})));
  } catch (err) {
    if (err instanceof AppError) return json_({ ok: false, code: err.code, message: err.message });
    console.error(err && err.stack || err);
    return json_({ ok: false, code: 'SERVER', message: 'Something went wrong. Please try again.' });
  }
}

function doGet() {
  return json_({ ok: true, message: 'PLINTH backend is running' });
}

// ───────────────────────── Actions ─────────────────────────

function register_(p) {
  var name = req_(p.name, 'Name', 80);
  var email = req_(p.email, 'Email', 120).toLowerCase();
  var phone = req_(p.phone, 'Phone', 10);
  var college = req_(p.college, 'College', 150);
  var accommodation = p.accommodation ? 'Yes' : 'No';
  var referral = String(p.referral || '').trim().toUpperCase().slice(0, 20);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('INVALID', 'Invalid email');
  if (!/^\d{10}$/.test(phone)) throw new AppError('INVALID', 'Invalid phone number');
  if (!p.aadhar || !p.aadhar.base64) throw new AppError('INVALID', 'Aadhaar file is required');

  // 1) Cheap checks before the (slow) file upload.
  var dup = findDuplicate_(rows_(SHEETS.PARTICIPANTS), email, phone);
  if (dup) return duplicateResult_(dup, email, phone);
  if (referral && !findBy_(rows_(SHEETS.AMBASSADORS), A.CODE, referral)) {
    throw new AppError('INVALID', 'Referral code "' + referral + '" not found. Check it with your campus ambassador, or leave it blank.');
  }

  // 2) Upload file OUTSIDE the lock so slow uploads don't block everyone.
  var file = saveAadhar_(p.aadhar, email);

  // 3) Critical section: re-check + assign ID + write.
  var result;
  try {
    result = withLock_(function () {
      var rows = rows_(SHEETS.PARTICIPANTS);
      var dup2 = findDuplicate_(rows, email, phone);
      if (dup2) return { dup: dup2 };
      var id = randomId_(rows, P.ID, ID_PREFIX, ID_DIGITS);
      append_(SHEETS.PARTICIPANTS, [id, name, email, phone, college, accommodation,
                                    referral, file.getUrl(), now_()]);
      return { id: id };
    });
  } catch (err) {
    trash_(file);
    throw err;
  }

  if (result.dup) {
    trash_(file);
    return duplicateResult_(result.dup, email, phone);
  }

  try { file.setName(result.id + ' - ' + name + suffixOf_(file.getName())); } catch (e) {}
  return { plinthId: result.id, name: name, email: email, alreadyRegistered: false };
}

/** Log in with the email + phone used at registration (shows their PLINTH ID). */
function login_(p) {
  if (p.plinthId) { // silent session refresh from a device that already logged in
    var known = auth_(p.plinthId, p.email);
    return { participant: publicParticipant_(known), teams: myTeams_(known[P.ID]) };
  }
  var email = String(p.email || '').trim().toLowerCase();
  var phone = String(p.phone || '').trim();
  if (!email || !phone) throw new AppError('INVALID', 'Email and phone are required.');
  var me = null;
  var rows = rows_(SHEETS.PARTICIPANTS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][P.EMAIL].toLowerCase() === email && rows[i][P.PHONE] === phone) { me = rows[i]; break; }
  }
  if (!me) throw new AppError('UNAUTHORIZED', 'No registration found with this email and phone number.');
  return { participant: publicParticipant_(me), teams: myTeams_(me[P.ID]) };
}

function listTeams_(p) {
  var eventId = req_(p.eventId, 'Event', 60);
  var teams = rows_(SHEETS.TEAMS).filter(function (t) { return t[T.EVENT] === eventId; });
  var members = rows_(SHEETS.MEMBERS);
  var participants = indexBy_(rows_(SHEETS.PARTICIPANTS), P.ID);
  return {
    teams: teams.map(function (t) {
      var count = members.filter(function (m) { return m[M.TEAM] === t[T.ID]; }).length;
      var max = Number(t[T.MAX]) || 1;
      var leader = participants[t[T.LEADER]];
      return {
        teamId: t[T.ID],
        teamName: t[T.NAME],
        leaderName: leader ? leader[P.NAME] : '',
        leaderCollege: leader ? leader[P.COLLEGE] : '',
        memberCount: count,
        maxSize: max,
        isFull: count >= max,
      };
    }),
  };
}

function createTeam_(p) {
  var eventId = req_(p.eventId, 'Event', 60);
  var eventName = req_(p.eventName, 'Event name', 100);
  var maxSize = Math.max(1, Math.min(50, Number(p.maxSize) || 1));
  var teamName = cleanTeamName_(p.teamName);

  return withLock_(function () {
    var me = auth_(p.plinthId, p.email);
    var pid = me[P.ID];
    var teams = rows_(SHEETS.TEAMS);
    var members = rows_(SHEETS.MEMBERS);

    var existing = membershipFor_(members, pid, eventId);
    if (existing) {
      var t = findBy_(teams, T.ID, existing[M.TEAM]);
      // Idempotent retry: same leader, same name → return the same team.
      if (t && t[T.LEADER] === pid && t[T.NAME].toLowerCase() === teamName.toLowerCase()) {
        return { team: teamView_(t, members, pid) };
      }
      throw new AppError('CONFLICT', 'You are already in team "' + (t ? t[T.NAME] : existing[M.TEAM]) +
                         '" for this event.');
    }
    var clash = teams.some(function (t) {
      return t[T.EVENT] === eventId && t[T.NAME].toLowerCase() === teamName.toLowerCase();
    });
    if (clash) throw new AppError('CONFLICT', 'A team named "' + teamName + '" already exists in this event. Pick another name.');

    var teamId = randomId_(teams, T.ID, TEAM_PREFIX, TEAM_DIGITS);
    var code = joinCode_(teams);
    var at = now_();
    var row = [teamId, teamName, eventId, eventName, pid, code, String(maxSize), at];
    append_(SHEETS.TEAMS, row);
    append_(SHEETS.MEMBERS, [teamId, eventId, pid, 'Leader', at]);
    members.push([teamId, eventId, pid, 'Leader', at]);
    return { team: teamView_(row, members, pid) };
  });
}

function joinTeam_(p) {
  var teamId = req_(p.teamId, 'Team', 20);
  var code = req_(p.joinCode, 'Join code', 12).toUpperCase().replace(/\s+/g, '');

  return withLock_(function () {
    var me = auth_(p.plinthId, p.email);
    var pid = me[P.ID];
    var teams = rows_(SHEETS.TEAMS);
    var members = rows_(SHEETS.MEMBERS);

    var team = findBy_(teams, T.ID, teamId);
    if (!team) throw new AppError('NOT_FOUND', 'Team not found. Refresh the list.');
    if (team[T.CODE].toUpperCase() !== code) throw new AppError('UNAUTHORIZED', 'Wrong join code. Ask your team leader for it.');

    var existing = membershipFor_(members, pid, team[T.EVENT]);
    if (existing) {
      if (existing[M.TEAM] === teamId) return { team: teamView_(team, members, pid) }; // idempotent retry
      var other = findBy_(teams, T.ID, existing[M.TEAM]);
      throw new AppError('CONFLICT', 'You are already in team "' + (other ? other[T.NAME] : existing[M.TEAM]) +
                         '" for this event.');
    }

    var count = members.filter(function (m) { return m[M.TEAM] === teamId; }).length;
    var max = Number(team[T.MAX]) || 1;
    if (count >= max) throw new AppError('FULL', 'Team "' + team[T.NAME] + '" is full (' + count + '/' + max + ').');

    var row = [teamId, team[T.EVENT], pid, 'Member', now_()];
    append_(SHEETS.MEMBERS, row);
    members.push(row);
    return { team: teamView_(team, members, pid) };
  });
}

/** Campus ambassador application. One per email / phone. Returns their unique referral code. */
function ambassador_(p) {
  var name = req_(p.name, 'Name', 80);
  var email = req_(p.email, 'Email', 120).toLowerCase();
  var phone = req_(p.phone, 'Phone', 10);
  var college = req_(p.college, 'College', 150);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('INVALID', 'Invalid email');
  if (!/^\d{10}$/.test(phone)) throw new AppError('INVALID', 'Invalid phone number');

  return withLock_(function () {
    var rows = rows_(SHEETS.AMBASSADORS);
    for (var i = 0; i < rows.length; i++) {
      var sameEmail = rows[i][A.EMAIL].toLowerCase() === email;
      var samePhone = rows[i][A.PHONE] === phone;
      if (sameEmail && samePhone) {
        // Retry / double click / lost code → give back the same code.
        var code = rows[i][A.CODE];
        if (!code) { // row from before referral codes existed
          code = referralCode_(rows, rows[i][A.NAME]);
          sheet_(SHEETS.AMBASSADORS).getRange(i + 2, A.CODE + 1).setNumberFormat('@').setValue(code);
        }
        return { referralCode: code, name: rows[i][A.NAME], alreadyApplied: true };
      }
      if (sameEmail || samePhone) {
        throw new AppError('CONFLICT', 'An application with this ' + (sameEmail ? 'email' : 'phone number') +
          ' already exists. Enter the same email AND phone you applied with to see your referral code.');
      }
    }
    var newCode = referralCode_(rows, name);
    append_(SHEETS.AMBASSADORS, [name, email, phone, college, now_(), newCode]);
    return { referralCode: newCode, name: name, alreadyApplied: false };
  });
}

// ───────────────────────── Helpers ─────────────────────────

function AppError(code, message) { this.code = code; this.message = message; }
AppError.prototype = Object.create(Error.prototype);

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    throw new AppError('BUSY', 'Too many people registering right now. Please try again in a few seconds.');
  }
  try {
    var out = fn();
    SpreadsheetApp.flush(); // make writes visible before the next request reads
    return out;
  } finally {
    lock.releaseLock();
  }
}

function req_(v, label, max) {
  var s = String(v == null ? '' : v).trim();
  if (!s) throw new AppError('INVALID', label + ' is required');
  if (s.length > max) throw new AppError('INVALID', label + ' is too long');
  return s;
}

/** Prevent formula injection (=, +, -, @ at the start of a cell). */
function safeCell_(v) {
  var s = String(v == null ? '' : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function now_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }

/** Random, unique ID like PLINTH48213. Must be called inside withLock_. */
function randomId_(rows, col, prefix, digits) {
  var used = {};
  rows.forEach(function (r) { used[r[col]] = true; });
  var min = Math.pow(10, digits - 1), span = 9 * min; // never starts with 0
  for (var tries = 0; tries < 200; tries++) {
    var id = prefix + String(min + Math.floor(Math.random() * span));
    if (!used[id]) return id;
  }
  throw new AppError('SERVER', 'Could not generate a unique ID, please try again.');
}

/** Referral code: up to 4 letters of the first name + 4 random digits, e.g. RIYA4821. */
function referralCode_(rows, name) {
  var used = {};
  rows.forEach(function (r) { used[r[A.CODE]] = true; });
  var letters = String(name).split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'PL';
  for (var tries = 0; tries < 200; tries++) {
    var code = letters + String(1000 + Math.floor(Math.random() * 9000));
    if (!used[code]) return code;
  }
  throw new AppError('SERVER', 'Could not generate a referral code, please try again.');
}

function joinCode_(teams) {
  var used = {};
  teams.forEach(function (t) { used[t[T.CODE]] = true; });
  for (var tries = 0; tries < 50; tries++) {
    var c = '';
    for (var i = 0; i < 6; i++) c += JOIN_CODE_ALPHABET.charAt(Math.floor(Math.random() * JOIN_CODE_ALPHABET.length));
    if (!used[c]) return c;
  }
  throw new AppError('SERVER', 'Could not generate join code, try again.');
}

function cleanTeamName_(v) {
  var s = String(v || '').replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > 40) throw new AppError('INVALID', 'Team name must be 2–40 characters.');
  return s;
}

function findBy_(rows, col, value) {
  for (var i = 0; i < rows.length; i++) if (rows[i][col] === value) return rows[i];
  return null;
}

function indexBy_(rows, col) {
  var o = {};
  rows.forEach(function (r) { o[r[col]] = r; });
  return o;
}

function findDuplicate_(rows, email, phone) {
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][P.EMAIL].toLowerCase() === email || rows[i][P.PHONE] === phone) return rows[i];
  }
  return null;
}

/**
 * Same email AND same phone → treat as a retry (e.g. the user's network dropped
 * after we saved) and give back their existing ID. Otherwise it's a clash.
 */
function duplicateResult_(row, email, phone) {
  if (row[P.EMAIL].toLowerCase() === email && row[P.PHONE] === phone) {
    return { plinthId: row[P.ID], name: row[P.NAME], email: email, alreadyRegistered: true };
  }
  var which = row[P.EMAIL].toLowerCase() === email ? 'email' : 'phone number';
  throw new AppError('CONFLICT', 'This ' + which + ' is already registered. Use "Already registered?" and log in with the SAME email and phone.');
}

function auth_(plinthId, email) {
  var id = String(plinthId || '').trim().toUpperCase();
  var em = String(email || '').trim().toLowerCase();
  if (!id || !em) throw new AppError('UNAUTHORIZED', 'PLINTH ID and email are required.');
  var me = findBy_(rows_(SHEETS.PARTICIPANTS), P.ID, id);
  if (!me || me[P.EMAIL].toLowerCase() !== em) throw new AppError('UNAUTHORIZED', 'PLINTH ID and email do not match.');
  return me;
}

function publicParticipant_(r) {
  return { plinthId: r[P.ID], name: r[P.NAME], email: r[P.EMAIL], college: r[P.COLLEGE] };
}

function membershipFor_(members, pid, eventId) {
  for (var i = 0; i < members.length; i++) {
    if (members[i][M.PID] === pid && members[i][M.EVENT] === eventId) return members[i];
  }
  return null;
}

function teamView_(t, members, viewerPid, participants) {
  participants = participants || indexBy_(rows_(SHEETS.PARTICIPANTS), P.ID);
  var mine = members.filter(function (m) { return m[M.TEAM] === t[T.ID]; });
  var isLeader = t[T.LEADER] === viewerPid;
  return {
    teamId: t[T.ID],
    teamName: t[T.NAME],
    eventId: t[T.EVENT],
    eventName: t[T.EVENT_NAME],
    role: isLeader ? 'Leader' : 'Member',
    joinCode: isLeader ? t[T.CODE] : null, // only the leader sees the code
    maxSize: Number(t[T.MAX]) || 1,
    members: mine.map(function (m) {
      var pr = participants[m[M.PID]];
      return { plinthId: m[M.PID], name: pr ? pr[P.NAME] : m[M.PID], role: m[M.ROLE] };
    }),
  };
}

function myTeams_(pid) {
  var members = rows_(SHEETS.MEMBERS);
  var teams = indexBy_(rows_(SHEETS.TEAMS), T.ID);
  var participants = indexBy_(rows_(SHEETS.PARTICIPANTS), P.ID);
  return members
    .filter(function (m) { return m[M.PID] === pid && teams[m[M.TEAM]]; })
    .map(function (m) { return teamView_(teams[m[M.TEAM]], members, pid, participants); });
}

function saveAadhar_(a, email) {
  var allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' };
  var ext = allowed[a.mimeType];
  if (!ext) throw new AppError('INVALID', 'Aadhaar must be a JPG, PNG or PDF.');
  var bytes = Utilities.base64Decode(a.base64);
  if (bytes.length > 2 * 1024 * 1024) throw new AppError('INVALID', 'Aadhaar file must be under 2 MB.');
  var folderId = props_().getProperty('AADHAR_FOLDER_ID');
  if (!folderId) throw new AppError('CONFIG', 'Backend not set up. Run setup() in Apps Script.');
  var blob = Utilities.newBlob(bytes, a.mimeType, 'pending - ' + email + ' - ' + Date.now() + ext);
  return DriveApp.getFolderById(folderId).createFile(blob); // private: only the sheet owner can see it
}

function suffixOf_(name) {
  var m = /\.[a-z0-9]+$/i.exec(name);
  return m ? m[0] : '';
}

function trash_(file) {
  try { file.setTrashed(true); } catch (e) {}
}
