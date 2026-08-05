import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Sidebar from "@/components/Sidebar";
import InstructorRoster from "@/components/InstructorRoster";
import SlotScheduler from "@/components/SlotScheduler";
import FleetManager from "@/components/FleetManager";
import InstructorProfile from "@/components/InstructorProfile";
import { useAuth } from "@/context/AuthContext";
import { GaugeCircle } from "lucide-react";

export default function Dashboard() {
  const [tab, setTab] = useState("roster");
  const [globalSearch, setGlobalSearch] = useState("");
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f172a] relative">
      <div className="grain-overlay" />
      <AppHeader onSearch={setGlobalSearch} />

      <div className="flex">
        <Sidebar active={tab} onChange={setTab} />

        <main className="flex-1 min-w-0 px-6 lg:px-10 py-10 relative z-10">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">
                {user?.role === "admin" ? "Admin Console" : "Instructor Console"}
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading font-bold leading-tight">
                Hello, <span className="text-[#10b981]">{(user?.name || "Instructor").split(" ")[0]}</span>.
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-lg">
                Manage your roster, availability, fleet, and profile — all in one place.
              </p>
            </div>
            <div className="glass-card px-5 py-4 flex items-center gap-4 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-[#10b981] flex items-center justify-center">
                <GaugeCircle className="w-5 h-5 text-[#022c22]" strokeWidth={2} />
              </div>
              <div>
                <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Now</div>
                <div className="font-heading font-semibold text-slate-100">On duty</div>
              </div>
            </div>
          </div>

          <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto">
            {[
              { id: "roster", label: "Roster" },
              { id: "scheduler", label: "Slots" },
              { id: "fleet", label: "Fleet" },
              { id: "profile", label: "Profile" },
            ].map((t) => (
              <button
                key={t.id}
                data-testid={`mobile-tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                  tab === t.id
                    ? "bg-[#10b981] text-[#022c22] border-[#10b981]"
                    : "bg-white/5 text-slate-300 border-white/10"
                }`}
              >{t.label}</button>
            ))}
          </div>

          {tab === "roster" && <InstructorRoster searchQuery={globalSearch} />}
          {tab === "scheduler" && <SlotScheduler />}
          {tab === "fleet" && <FleetManager />}
          {tab === "profile" && <InstructorProfile />}
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
