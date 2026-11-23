"use client";

import { Users, FileText, Sparkles } from "lucide-react";
import RegisterButton from "../RegisterButton";
import { orbitron_500_700_900 as orbitron } from "../../lib/fonts";


const GROUP_DISCOUNT_CONTACTS = [
  { name: "Anant Bagla", phone: "6350156384" },
  { name: "Daksh Vashishtha", phone: "9358944736" },
  { name: "Sumit Jalan", phone: "9935342414" },
];

const REGISTRATION_HELP_CONTACTS = [
  { name: "Daksh Vashishtha", phone: "9358944736" },
  { name: "Diya Rathore", phone: "6377150154" },
];

export default function RegistrationInfo() {
  const steps = [
    "Fill in your contact information",
    "Choose your preferred package",
    "Pay securely using QR code",
    "Receive your digital pass",
  ];

  return (
    <section className="relative min-h-screen px-6 sm:px-10 py-20 text-white overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent pointer-events-none" />
      
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.02]" 
           style={{
             backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }} 
      />

      <div className="relative max-w-5xl mx-auto space-y-20">

        {/* PAGE TITLE */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 mb-4">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium tracking-wide">
              JOIN PLINTH 2027
            </span>
          </div>
          
          <h1
            className={`${orbitron.className} text-5xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent leading-tight`}
          >
            Registration
          </h1>
          
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto" />
          
          <p className="text-gray-400 max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed">
            Everything you need to know to secure your spot
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* GROUP DISCOUNTS */}
          <div className="group space-y-6 p-8 rounded-2xl bg-gradient-to-br from-yellow-500/50 to-transparent border border-yellow-400/10 hover:border-yellow-400/30 transition-all duration-500 hover:shadow-lg hover:shadow-yellow-400/5">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-yellow-400/10 group-hover:bg-yellow-400/20 transition-colors duration-300">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
              <h2
                className={`${orbitron.className} text-2xl sm:text-3xl font-bold`}
              >
                Group Discounts
              </h2>
            </div>

            <p className="text-gray-300 leading-relaxed text-lg">
              Bringing your <span className="text-yellow-400 font-semibold">entire squad</span>? 
              We offer special pricing for group registrations to make it easier for teams to join.
            </p>

            <div className="pt-4 border-t border-white/5">
              <p className="text-gray-500 text-sm uppercase tracking-wider mb-3 font-medium">
                Contact for details
              </p>
              <ul className="space-y-3">
                {GROUP_DISCOUNT_CONTACTS.map((c) => (
                  <li key={c.phone} className="flex items-center justify-between gap-3">
                    <span className="text-gray-200 font-medium min-w-0">{c.name}</span>
                    <a
                      href={`tel:+91${c.phone}`}
                      className="shrink-0 inline-flex items-center gap-2 text-yellow-400 font-mono text-base sm:text-xl hover:text-yellow-300 transition-colors group/link"
                    >
                      <span>{c.phone}</span>
                      <svg className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all"
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* HOW TO REGISTER */}
          <div className="group space-y-6 p-8 rounded-2xl bg-gradient-to-br from-emerald-500/50 to-transparent border border-emerald-400/10 hover:border-emerald-400/30 transition-all duration-500 hover:shadow-lg hover:shadow-emerald-400/5">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-emerald-400/10 group-hover:bg-emerald-400/20 transition-colors duration-300">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h2
                className={`${orbitron.className} text-2xl sm:text-3xl font-bold`}
              >
                How to Register
              </h2>
            </div>

            <ol className="space-y-5">
              {steps.map((step, index) => (
                <li 
                  key={index} 
                  className="flex gap-4 group/item hover:translate-x-1 transition-transform duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 font-bold text-sm group-hover/item:bg-emerald-400/20 transition-colors">
                    {index + 1}
                  </span>
                  <span className="text-gray-300 text-lg leading-relaxed pt-1">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            <div className="pt-4 border-t border-white/5">
              <p className="text-gray-500 text-sm mb-3">Need assistance? Contact</p>
              <ul className="space-y-2">
                {REGISTRATION_HELP_CONTACTS.map((c) => (
                  <li key={c.phone} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-300 min-w-0">{c.name}</span>
                    <a
                      href={`tel:+91${c.phone}`}
                      className="shrink-0 text-emerald-400 font-semibold font-mono hover:text-emerald-300 transition-colors hover:underline underline-offset-2"
                    >
                      {c.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-10 space-y-6">
          <div className="inline-block transform hover:scale-105 transition-transform duration-300">
            <RegisterButton />
          </div>
          <p className="text-gray-500 text-base sm:text-lg tracking-wide">
            Secure your spot at Plinth — Limited availability
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </section>
  );
}