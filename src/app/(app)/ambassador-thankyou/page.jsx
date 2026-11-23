"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Home, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });

export default function AmbassadorThankYouPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("code") || "";
    if (/^[A-Z]{1,4}\d{4}$/.test(c)) setCode(c);
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Referral code copied!");
    } catch {
      toast.error("Couldn't copy — please note it down.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/backgrounds/ambassador-thankyou-space.webp"
          alt="Space Background"
          className="w-full h-full object-cover "
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full bg-gray-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-gradient-to-tr from-white to-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Welcome Aboard!
        </h1>

        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
          Thank you for applying to be a <span className="text-purple-400 font-semibold">Plinth Campus Ambassador</span>.
        </p>

        {code ? (
          <div className="bg-white/5 border border-purple-500/30 rounded-xl p-6 mb-8">
            <p className="text-gray-400 text-sm mb-3">Your unique referral code</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className={`${orbitron.className} text-4xl font-extrabold tracking-widest text-white`}>{code}</span>
              <button onClick={copyCode} aria-label="Copy referral code" className="p-2 rounded-lg border border-white/20 hover:border-purple-400 text-gray-300">
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Share this code with participants. They enter it in the <span className="text-white">Referral Code</span> field while registering, and it&apos;s credited to you.
            </p>
            <p className="text-yellow-300/90 text-xs mt-3">
              Save it now (screenshot or copy) — it will <b>not</b> be emailed. If you lose it, submit the application form again with the same email and phone to see it.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <p className="text-gray-400 text-sm">
              To see your referral code, submit the application form with the email and phone you applied with.
            </p>
          </div>
        )}

        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-white font-medium group"
        >
          <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}
