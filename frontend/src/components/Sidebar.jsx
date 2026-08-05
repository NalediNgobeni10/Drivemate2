import { Users, CalendarDays, UserCircle2, Truck } from "lucide-react";

const items = [
  { id: "roster", label: "Instructor Roster", icon: Users, testId: "sidebar-roster" },
  { id: "scheduler", label: "Calendar Slots", icon: CalendarDays, testId: "sidebar-scheduler" },
  { id: "fleet", label: "Fleet Manager", icon: Truck, testId: "sidebar-fleet" },
  { id: "profile", label: "Profile", icon: UserCircle2, testId: "sidebar-profile" },
];

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0f172a]/60 backdrop-blur-xl px-3 py-6 gap-1 min-h-[calc(100vh-4rem)] sticky top-16">
      <div className="font-mono-tech text-[10px] text-slate-500 uppercase tracking-widest px-3 mb-3">
        Workspace
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            data-testid={item.testId}
            onClick={() => onChange(item.id)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 ${
              isActive
                ? "bg-[#1D6A4A]/25 border border-[#10b981]/30 text-white"
                : "text-slate-300 hover:bg-white/5 border border-transparent"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isActive ? "bg-[#10b981] text-[#022c22]" : "bg-white/5 text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-medium">{item.label}</div>
            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
          </button>
        );
      })}
      <div className="mt-auto glass-card p-4">
        <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-1">
          Fleet Status
        </div>
        <div className="font-heading font-semibold text-sm leading-tight">All Systems Go</div>
        <div className="text-[11px] text-slate-400 mt-1">v2.1 · Automated reminders on</div>
      </div>
    </aside>
  );
}
