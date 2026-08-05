import { Car } from "lucide-react";

export default function AppFooter() {
  return (
    <footer
      data-testid="app-footer"
      className="mt-16 border-t border-white/10 bg-[#0f172a]/80 backdrop-blur-xl"
    >
      <div className="px-6 lg:px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D6A4A] flex items-center justify-center">
              <Car className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <div className="font-heading font-bold text-lg">DriveMate</div>
              <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">
                Driving School Management Suite
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Managing driving education across Code 8 and Code 10 licence tracks with clarity and care.
          </p>
        </div>

        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-3">
            Contact
          </div>
          <div className="font-heading font-semibold text-base mb-1">Front Desk</div>
          <div className="text-sm text-slate-400">Mon – Fri · 07:30 – 18:00</div>
          <div className="text-sm text-slate-400">Sat · 08:00 – 13:00</div>
        </div>

        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-3">
            Build
          </div>
          <div className="text-sm text-slate-400 mb-1">v2.1 · 2026</div>
          <div className="text-sm text-slate-400">
            Crafted with care for driving instructors
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-6 lg:px-10 py-4 text-[11px] text-slate-500 font-mono-tech uppercase tracking-widest flex justify-between">
        <span>© 2026 DriveMate · All rights reserved</span>
        <span className="hidden sm:block">Drive safe · Learn steady</span>
      </div>
    </footer>
  );
}
