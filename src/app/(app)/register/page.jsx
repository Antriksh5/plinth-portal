"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, School, BedDouble, Check, Upload, FileCheck, X,
  Rocket, ArrowLeft, Copy, ArrowRight, Gift,
} from "lucide-react";
import SpaceShell, { Card, PrimaryButton, inputCls, orbitron } from "../../../components/SpaceShell";
import { useData } from "../../../context/form.context";
import { api } from "../../../lib/api";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { setParticipant } = useData();
  const fileRef = useRef(null);
  const submittingRef = useRef(false); // blocks double-clicks before React re-renders

  const [form, setForm] = useState({ name: "", email: "", phone: "", college: "", referral: "" });
  const [accommodation, setAccommodation] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { plinthId, name, alreadyRegistered }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickFile = (f) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) return toast.error("Upload a JPG, PNG or PDF.");
    if (f.size > MAX_FILE_BYTES) return toast.error("File must be under 2 MB. Try compressing it.");
    setFile(f);
  };

  const validate = () => {
    const phone = form.phone.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
    if (form.name.trim().length < 2) return "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email.";
    if (!/^[6-9]\d{9}$/.test(phone)) return "Please enter a valid 10-digit mobile number.";
    if (form.college.trim().length < 2) return "Please enter your college.";
    if (form.referral.trim() && !/^[A-Za-z]{1,4}\d{4}$/.test(form.referral.trim()))
      return "Referral code looks wrong (e.g. RIYA4821). Leave it blank if you don't have one.";
    if (!file) return "Please upload your Aadhaar card.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    const err = validate();
    if (err) return toast.error(err);

    submittingRef.current = true;
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
    fd.append("accommodation", String(accommodation));
    fd.append("aadhar", file);

    const res = await api("/api/participant", { method: "POST", formData: fd });
    setLoading(false);
    submittingRef.current = false;

    if (!res.ok) return toast.error(res.message, { duration: 6000 });

    setParticipant({ plinthId: res.plinthId, name: res.name, email: res.email });
    setDone(res);
    if (res.alreadyRegistered) toast("You were already registered — here's your existing ID.", { icon: "ℹ️" });
    else toast.success("Registration successful!");
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(done.plinthId);
      toast.success("Copied!");
    } catch {
      toast.error("Couldn't copy — please note it down.");
    }
  };

  if (done) {
    return (
      <SpaceShell step={2} subtitle="You're in!">
        <Card className="text-center">
          <p className="text-gray-400 mb-2">Welcome aboard, {done.name}. Your PLINTH ID is</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className={`${orbitron.className} text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent`}
            >
              {done.plinthId}
            </span>
            <button onClick={copyId} className="p-2 rounded-lg border border-gray-700 hover:border-cyan-500 text-gray-300" aria-label="Copy ID">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-yellow-300/90 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 mb-6">
            Save this ID. To create or join teams later, log in with your email ({done.email}) and phone number.
          </p>
          <PrimaryButton className="w-full" onClick={() => router.push("/teams")}>
            <span>Choose Event & Team</span>
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </PrimaryButton>
        </Card>
      </SpaceShell>
    );
  }

  return (
    <SpaceShell step={1} subtitle="Step 1 · Register yourself">
      <Card>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <span className="text-gray-400">Every participant registers individually and gets a PLINTH ID.</span>
          <Link href="/teams" className="text-cyan-400 hover:text-cyan-300 whitespace-nowrap">
            Already registered? →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field icon={User} label="Full Name *">
              <input className={inputCls} value={form.name} onChange={update("name")} placeholder="Neil Armstrong" maxLength={80} disabled={loading} />
            </Field>
            <Field icon={School} label="College *">
              <input className={inputCls} value={form.college} onChange={update("college")} placeholder="Space University" maxLength={150} disabled={loading} />
            </Field>
            <Field icon={Phone} label="Contact Number *">
              <input className={inputCls} type="tel" value={form.phone} onChange={update("phone")} placeholder="98765 43210" maxLength={16} disabled={loading} />
            </Field>
            <Field icon={Mail} label="Email Address *">
              <input className={inputCls} type="email" value={form.email} onChange={update("email")} placeholder="astronaut@space.com" maxLength={120} disabled={loading} />
            </Field>
          </div>

          {/* Accommodation */}
          <label className="flex items-center gap-3 cursor-pointer select-none p-4 rounded-2xl border border-gray-800 bg-black/30">
            <input type="checkbox" className="sr-only" checked={accommodation} onChange={(e) => setAccommodation(e.target.checked)} disabled={loading} />
            <div className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${accommodation ? "bg-gradient-to-br from-cyan-500 to-blue-500 border-transparent" : "border-gray-600 bg-black/30"}`}>
              {accommodation && <Check className="w-4 h-4 text-white" />}
            </div>
            <BedDouble className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-gray-300">I need accommodation during the fest</span>
          </label>

          {/* Aadhaar */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Aadhaar Card * <span className="text-gray-600">(JPG / PNG / PDF, max 2 MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }}
            />
            {file ? (
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
                <div className="flex items-center gap-3 min-w-0">
                  <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-white truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
                <button type="button" disabled={loading} onClick={() => setFile(null)} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
                className="w-full border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-2xl py-8 text-gray-400 hover:text-cyan-400 transition-all flex flex-col items-center gap-2"
              >
                <Upload className="w-6 h-6" />
                <span>Click or drop your Aadhaar here</span>
              </button>
            )}
            <p className="text-xs text-gray-600">Stored privately. Only the PLINTH organising team can access it.</p>
          </div>

          <Field icon={Gift} label="Referral Code (optional)">
            <input className={`${inputCls} uppercase`} value={form.referral} onChange={(e) => setForm((f) => ({ ...f, referral: e.target.value.toUpperCase().replace(/\s/g, "") }))} placeholder="Campus ambassador code, e.g. RIYA4821" maxLength={8} disabled={loading} />
          </Field>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <PrimaryButton type="submit" loading={loading} loadingText="Registering..." className="flex-1">
              <Rocket className="w-5 h-5 text-cyan-400" />
              <span>Get My PLINTH ID</span>
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </SpaceShell>
  );
}
