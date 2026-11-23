"use client";
import { motion } from "framer-motion";
import { Orbitron } from "next/font/google";
import { Satellite, Sparkles, UserCheck, Trophy, Users, Check } from "lucide-react";
import { Particles } from "./ui/particles";
import { Meteors } from "./ui/meteors";

export const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const STEPS = [
  { n: 1, title: "Register", icon: UserCheck },
  { n: 2, title: "Event", icon: Trophy },
  { n: 3, title: "Team", icon: Users },
];

export const inputCls =
  "w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none transition-colors disabled:opacity-60";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`relative backdrop-blur-xl bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-800/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-cyan-500/10 ${className}`}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 pointer-events-none" />
      <div className="absolute inset-0 rounded-3xl border border-cyan-500/20 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function PrimaryButton({ loading, loadingText = "Please wait...", children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: props.disabled || loading ? 1 : 0.97 }}
      disabled={loading || props.disabled}
      {...props}
      className={`relative overflow-hidden group disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl pointer-events-none" />
      <div className="relative bg-black rounded-2xl px-6 py-3.5 m-0.5 flex items-center justify-center gap-3 text-white font-semibold">
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-cyan-400">{loadingText}</span>
          </>
        ) : (
          children
        )}
      </div>
    </motion.button>
  );
}

export default function SpaceShell({ step, subtitle, children }) {
  return (
    <div className="relative min-h-screen w-full overflow-clip bg-black">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Particles />
      </div>
      <Meteors number={20} />

      <div className="relative z-10 min-h-screen flex items-start md:items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl py-6"
        >
          <div className={`text-center mb-8 ${orbitron.className}`}>
            <div className="inline-flex items-center gap-3 mb-4">
              <Satellite className="w-8 h-8 text-cyan-400" />
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              PLINTH 2027
            </h1>
            {subtitle && <p className="text-gray-400 text-lg md:text-xl">{subtitle}</p>}
          </div>

          {step && (
            <div className="flex justify-center mb-10">
              <div className="flex items-center">
                {STEPS.map((s, i) => (
                  <div key={s.n} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          step >= s.n
                            ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400"
                            : "bg-black/50 border-gray-700"
                        }`}
                      >
                        <s.icon className={`w-5 h-5 ${step >= s.n ? "text-cyan-400" : "text-gray-500"}`} />
                        {step > s.n && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className={`text-xs ${step >= s.n ? "text-cyan-300" : "text-gray-500"}`}>{s.title}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`w-10 md:w-16 h-0.5 mx-1 mb-6 ${
                          step > s.n ? "bg-gradient-to-r from-cyan-400 to-blue-400" : "bg-gray-700"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {children}

          <p className="text-center mt-8 text-gray-600 text-sm">
            Powered by <span className="text-cyan-400 font-semibold">PLINTH 2027</span> • Interstellar Event Management
          </p>
        </motion.div>
      </div>
    </div>
  );
}
