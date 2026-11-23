"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Mail, Phone, LogOut, Users, Trophy, Search, Plus, UserPlus, RefreshCw,
  Copy, Crown, Check, ArrowLeft, Lock, Zap, PartyPopper,
} from "lucide-react";
import SpaceShell, { Card, PrimaryButton, inputCls, orbitron } from "../../../components/SpaceShell";
import { useData } from "../../../context/form.context";
import { api } from "../../../lib/api";
import { EVENTS, getEventById, sizeLabel } from "../../../lib/events";

const CLUBS = ["ALL", ...Array.from(new Set(EVENTS.map((e) => e.club)))];
const THANK_YOU_MESSAGE =
  "Thank you for registering, the organising team will soon reach you and discuss the price and packages";

async function copy(text, label = "Copied!") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Couldn't copy — please note it down.");
  }
}

// ─────────────────────── Login ───────────────────────

function LoginCard({ onLogin }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const res = await api("/api/participant/login", { method: "POST", json: { email, phone } });
    setLoading(false);
    if (!res.ok) return toast.error(res.message);
    onLogin(res);
  };

  return (
    <Card className="max-w-lg mx-auto">
      <h2 className={`${orbitron.className} text-2xl font-bold text-white mb-1`}>Log in</h2>
      <p className="text-gray-400 text-sm mb-6">Use the email and phone number you registered with.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className={`${inputCls} pl-11`} type="email" placeholder="astronaut@space.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="relative">
          <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className={`${inputCls} pl-11`} type="tel" placeholder="98765 43210" value={phone} maxLength={16} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <PrimaryButton type="submit" loading={loading} className="w-full">
          Continue
        </PrimaryButton>
      </form>
      <div className="flex justify-end mt-5 text-sm">
        <Link href="/register" className="text-cyan-400 hover:text-cyan-300">New here? Register →</Link>
      </div>
    </Card>
  );
}

// ─────────────────────── Team card ───────────────────────

function TeamCard({ team, highlight }) {
  const isSolo = team.maxSize === 1;
  const minSize = getEventById(team.eventId)?.minSize || 1;
  const missing = Math.max(0, minSize - team.members.length);
  return (
    <div className={`p-5 rounded-2xl border ${highlight ? "border-emerald-500/50 bg-emerald-500/5" : "border-gray-800 bg-gray-900/40"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-purple-300">{team.eventName}</p>
          <h3 className="text-lg font-semibold text-white">{isSolo ? "Solo entry" : team.teamName}</h3>
          <p className="text-xs text-gray-500">{team.teamId}</p>
        </div>
        {!isSolo && (
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
              {team.members.length}/{team.maxSize} members
            </span>
            {missing > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                Needs {missing} more member{missing > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {team.joinCode && !isSolo && (
        <div className="flex flex-wrap items-center gap-3 mb-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <span className="text-sm text-gray-400">Join code:</span>
          <span className={`${orbitron.className} text-xl tracking-widest text-cyan-300`}>{team.joinCode}</span>
          <button onClick={() => copy(team.joinCode, "Join code copied")} className="p-1.5 rounded-lg border border-gray-700 hover:border-cyan-500 text-gray-300" aria-label="Copy code">
            <Copy className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 w-full">Share this code only with your teammates.</span>
        </div>
      )}

      {!isSolo && (
        <ul className="flex flex-wrap gap-2">
          {team.members.map((m) => (
            <li key={m.plinthId} className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg bg-black/40 border border-gray-800 text-gray-200">
              {m.role === "Leader" && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
              {m.name} <span className="text-gray-500 text-xs">{m.plinthId}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────── Page ───────────────────────

export default function TeamsPage() {
  const { participant, setParticipant, participantReady } = useData();
  const [verified, setVerified] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [lastTeamId, setLastTeamId] = useState(null);

  const [eventQuery, setEventQuery] = useState("");
  const [club, setClub] = useState("ALL");
  const [teamQuery, setTeamQuery] = useState("");
  const [successTeam, setSuccessTeam] = useState(null); // shown after create / join
  const [eventId, setEventId] = useState("");
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [nextMode, setNextMode] = useState("create"); // tab to open after picking the next event

  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const listReq = useRef(0);

  const event = getEventById(eventId);
  const isSolo = event?.maxSize === 1;
  const registeredEventIds = useMemo(() => new Set(myTeams.map((t) => t.eventId)), [myTeams]);
  const q = eventQuery.trim().toLowerCase();
  const filteredEvents = EVENTS.filter(
    (e) => (club === "ALL" || e.club === club) && (!q || e.name.toLowerCase().includes(q) || e.club.toLowerCase().includes(q))
  );
  const tq = teamQuery.trim().toLowerCase();
  const visibleTeams = tq
    ? teams.filter((t) => t.teamName.toLowerCase().includes(tq) || t.leaderName.toLowerCase().includes(tq))
    : teams;

  const upsertTeam = (team) =>
    setMyTeams((prev) => [team, ...prev.filter((t) => t.teamId !== team.teamId)]);

  // Re-verify a stored session on load (and get fresh team list).
  useEffect(() => {
    if (!participantReady || !participant || verified) return;
    let cancelled = false;
    (async () => {
      const res = await api("/api/participant/login", {
        method: "POST",
        json: { plinthId: participant.plinthId, email: participant.email },
      });
      if (cancelled) return;
      if (!res.ok) {
        if (res.code === "UNAUTHORIZED") {
          setParticipant(null);
          toast.error("Session expired, please log in again.");
        } else {
          toast.error(res.message);
        }
        return;
      }
      setMyTeams(res.teams || []);
      setVerified(true);
    })();
    return () => { cancelled = true; };
  }, [participantReady, participant, verified, setParticipant]);

  const loadTeams = useCallback(async (id) => {
    if (!id) return;
    const req = ++listReq.current; // ignore stale responses when switching events quickly
    setTeamsLoading(true);
    const res = await api(`/api/teams?eventId=${encodeURIComponent(id)}`);
    if (req !== listReq.current) return;
    setTeamsLoading(false);
    if (!res.ok) return toast.error(res.message);
    setTeams(res.teams || []);
  }, []);

  useEffect(() => {
    if (eventId && mode === "join" && !isSolo) loadTeams(eventId);
  }, [eventId, mode, isSolo, loadTeams]);

  const chooseEvent = (id) => {
    setEventId(id);
    setMode(nextMode);
    setTeamName("");
    setTeams([]);
    setSelectedTeamId("");
    setJoinCode("");
    setTeamQuery("");
  };

  const showSuccess = (team) => {
    setSuccessTeam(team);
    chooseEvent("");
    // the page can be long now, bring the confirmation into view
    setTimeout(() => document.getElementById("team-step")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleLogin = (res) => {
    setParticipant(res.participant);
    setMyTeams(res.teams || []);
    setVerified(true);
    toast.success(`Welcome, ${res.participant.name}!`);
  };

  const logout = () => {
    setParticipant(null);
    setVerified(false);
    setMyTeams([]);
    setSuccessTeam(null);
    chooseEvent("");
  };

  const run = async (fn) => {
    if (busyRef.current) return; // block double submits
    busyRef.current = true;
    setBusy(true);
    try {
      await fn();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const createTeam = () =>
    run(async () => {
      if (!isSolo && teamName.trim().length < 2) return toast.error("Enter a team name (2–40 characters).");
      const res = await api("/api/teams", {
        method: "POST",
        json: { plinthId: participant.plinthId, email: participant.email, eventId, teamName },
      });
      if (!res.ok) return toast.error(res.message, { duration: 6000 });
      upsertTeam(res.team);
      setLastTeamId(res.team.teamId);
      toast.success(isSolo ? `Registered for ${event.name}!` : `Team "${res.team.teamName}" created!`);
      showSuccess(res.team);
    });

  const joinTeam = () =>
    run(async () => {
      if (!selectedTeamId) return toast.error("Select a team first.");
      if (joinCode.trim().length !== 6) return toast.error("Enter the 6-character join code from your leader.");
      const res = await api("/api/teams/join", {
        method: "POST",
        json: { plinthId: participant.plinthId, email: participant.email, teamId: selectedTeamId, joinCode },
      });
      if (!res.ok) {
        toast.error(res.message, { duration: 6000 });
        if (res.code === "FULL" || res.code === "NOT_FOUND") {
          setSelectedTeamId("");
          loadTeams(eventId); // someone took the last spot — refresh so they see current state
        }
        return;
      }
      upsertTeam(res.team);
      setLastTeamId(res.team.teamId);
      toast.success(`You joined "${res.team.teamName}"!`);
      showSuccess(res.team);
    });

  // ── Render ──
  if (!participantReady || (participant && !verified)) {
    return (
      <SpaceShell subtitle="Events & Teams">
        <div className="flex justify-center items-center gap-3 text-gray-300 py-16">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          Loading your profile...
        </div>
        {participant && (
          <div className="text-center">
            <button onClick={logout} className="text-sm text-gray-500 hover:text-white">Not you? Log out</button>
          </div>
        )}
      </SpaceShell>
    );
  }

  if (!participant) {
    return (
      <SpaceShell step={1} subtitle="Events & Teams">
        <LoginCard onLogin={handleLogin} />
      </SpaceShell>
    );
  }

  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId);

  return (
    <SpaceShell
      step={successTeam && !event ? 4 : event ? 3 : 2}
      subtitle={
        successTeam && !event
          ? "All steps complete 🎉"
          : event
          ? `Step 3 · Team for ${event.name}`
          : nextMode === "join"
          ? "Step 2 · Choose the event you want to join a team in"
          : "Step 2 · Choose an event"
      }
    >
      <div className="space-y-6">
        {/* Who am I */}
        <Card className="!p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Logged in as</p>
              <p className="text-white font-semibold">{participant.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copy(participant.plinthId, "PLINTH ID copied")}
                className={`${orbitron.className} px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 tracking-wider flex items-center gap-2`}
              >
                {participant.plinthId} <Copy className="w-4 h-4" />
              </button>
              <button onClick={logout} className="p-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white" aria-label="Log out" title="Log out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>

        {/* Event selection / team step */}
        <Card>
          <div id="team-step" className="scroll-mt-6" />
          <AnimatePresence mode="wait">
            {successTeam && !event ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <PartyPopper className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-lg md:text-xl text-white leading-relaxed max-w-xl mx-auto">{THANK_YOU_MESSAGE}</p>
                <div className="text-left">
                  <TeamCard team={successTeam} highlight />
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Want to take part in another event?</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {[
                      { m: "create", label: "Create another team", icon: Plus },
                      { m: "join", label: "Join a team", icon: UserPlus },
                    ].map((o) => (
                      <button
                        key={o.m}
                        onClick={() => {
                          setNextMode(o.m);
                          setSuccessTeam(null);
                          setTimeout(() => document.getElementById("team-step")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-700 text-gray-300 hover:text-white hover:border-cyan-500/60 hover:bg-cyan-500/5 transition-all"
                      >
                        <o.icon className="w-5 h-5" /> {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : !event ? (
              <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10">
                    <Trophy className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Pick an event</h2>
                </div>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className={`${inputCls} pl-11`} placeholder="Search events or clubs..." value={eventQuery} onChange={(e) => setEventQuery(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {CLUBS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setClub(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        club === c ? "bg-purple-500/20 border-purple-400 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                      }`}
                    >
                      {c === "ALL" ? "All clubs" : c}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredEvents.map((e) => {
                    const done = registeredEventIds.has(e.id);
                    return (
                      <button
                        key={e.id}
                        disabled={done}
                        onClick={() => chooseEvent(e.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          done ? "border-emerald-500/30 bg-emerald-500/5 cursor-default" : "border-gray-800 bg-black/30 hover:border-purple-500/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white font-medium">{e.name}</span>
                          {done ? (
                            <span className="text-xs flex items-center gap-1 text-emerald-400"><Check className="w-3.5 h-3.5" /> Registered</span>
                          ) : (
                            <span className="text-xs text-gray-500 shrink-0">{sizeLabel(e)}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{e.club}</span>
                      </button>
                    );
                  })}
                  {filteredEvents.length === 0 && <p className="text-gray-500 text-sm">No events match your search.</p>}
                </div>
              </motion.div>
            ) : (
              <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <button onClick={() => chooseEvent("")} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" /> All events
                </button>

                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">{event.name}</h2>
                  <span className="text-xs text-gray-500">{event.club} · {isSolo ? sizeLabel(event) : `Team of ${sizeLabel(event)}`}</span>
                </div>

                {isSolo ? (
                  <PrimaryButton onClick={createTeam} loading={busy} loadingText="Registering..." className="w-full">
                    <Check className="w-5 h-5 text-cyan-400" /> Register for {event.name}
                  </PrimaryButton>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-gray-800">
                      {[
                        { id: "create", label: "Create a team", icon: Plus },
                        { id: "join", label: "Join a team", icon: UserPlus },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setMode(t.id)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                            mode === t.id ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <t.icon className="w-4 h-4" /> {t.label}
                        </button>
                      ))}
                    </div>

                    {mode === "create" ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-400">
                          You&apos;ll be the team leader and get a join code to share with your teammates.
                          {event.minSize > 1 && <> Your team needs <b className="text-white">at least {event.minSize} members</b> to compete.</>}
                        </p>
                        <input
                          className={inputCls}
                          placeholder="Team name (e.g. Team Apollo)"
                          value={teamName}
                          maxLength={40}
                          onChange={(e) => setTeamName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && createTeam()}
                          disabled={busy}
                        />
                        <PrimaryButton onClick={createTeam} loading={busy} loadingText="Creating..." className="w-full">
                          <Plus className="w-5 h-5 text-cyan-400" /> Create Team
                        </PrimaryButton>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400">Select your team, then enter the join code your leader shared.</p>
                          <button onClick={() => loadTeams(eventId)} disabled={teamsLoading} className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white" aria-label="Refresh" title="Refresh">
                            <RefreshCw className={`w-4 h-4 ${teamsLoading ? "animate-spin" : ""}`} />
                          </button>
                        </div>

                        {teams.length > 5 && (
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input className={`${inputCls} pl-11`} placeholder="Search team or leader name..." value={teamQuery} onChange={(e) => setTeamQuery(e.target.value)} />
                          </div>
                        )}
                        <div className="space-y-2">
                          {teamsLoading && teams.length === 0 && <p className="text-gray-500 text-sm">Loading teams...</p>}
                          {!teamsLoading && teams.length === 0 && (
                            <p className="text-gray-500 text-sm">No teams yet for this event. Ask your leader to create one, or create your own.</p>
                          )}
                          {tq && visibleTeams.length === 0 && <p className="text-gray-500 text-sm">No team matches “{teamQuery}”.</p>}
                          {visibleTeams.map((t) => (
                            <button
                              key={t.teamId}
                              disabled={t.isFull || busy}
                              onClick={() => {
                                setSelectedTeamId(t.teamId);
                                setTimeout(() => document.getElementById("join-code")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
                              }}
                              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                                t.isFull
                                  ? "border-gray-800 bg-black/20 opacity-50 cursor-not-allowed"
                                  : selectedTeamId === t.teamId
                                  ? "border-cyan-400 bg-cyan-500/10"
                                  : "border-gray-800 bg-black/30 hover:border-gray-600"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate">{t.teamName}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  Leader: {t.leaderName}{t.leaderCollege ? ` · ${t.leaderCollege}` : ""}
                                </p>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${t.isFull ? "bg-red-500/10 text-red-400" : "bg-gray-800 text-gray-300"}`}>
                                {t.isFull ? "Full" : `${t.memberCount}/${t.maxSize}`}
                              </span>
                            </button>
                          ))}
                        </div>

                        {selectedTeam && (
                          <div id="join-code" className="space-y-3">
                            <div className="relative">
                              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                              <input
                                className={`${inputCls} pl-11 uppercase tracking-widest`}
                                placeholder="JOIN CODE"
                                value={joinCode}
                                maxLength={6}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                                onKeyDown={(e) => e.key === "Enter" && joinTeam()}
                                disabled={busy}
                              />
                            </div>
                            <PrimaryButton onClick={joinTeam} loading={busy} loadingText="Joining..." className="w-full">
                              <Users className="w-5 h-5 text-cyan-400" /> Join “{selectedTeam.teamName}”
                            </PrimaryButton>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* My registrations */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/10">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">My events & teams</h2>
          </div>
          {myTeams.length === 0 ? (
            <p className="text-gray-500 text-sm">You haven&apos;t joined any event yet. Pick one above.</p>
          ) : (
            <div className="space-y-3">
              {myTeams.map((t) => (
                <TeamCard key={t.teamId} team={t} highlight={t.teamId === lastTeamId} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </SpaceShell>
  );
}
