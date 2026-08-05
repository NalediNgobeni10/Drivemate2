import { Users, CalendarDays, UserCircle2, Truck, ShieldCheck, LineChart, MessageSquare, CreditCard, BookOpen } from "lucide-react";

const ALL_ITEMS = [
  { id: "roster", label: "Instructor Roster", icon: Users, roles: ["admin", "instructor"] },
  { id: "scheduler", label: "Calendar Slots", icon: CalendarDays, roles: ["admin", "instructor"] },
  { id: "book", label: "Book Lesson", icon: BookOpen, roles: ["student"] },
  { id: "my-lessons", label: "My Lessons", icon: CalendarDays, roles: ["student"] },
  { id: "payments", label: "Payments", icon: CreditCard, roles: ["admin", "student"] },
  { id: "messages", label: "Messages", icon: MessageSquare, roles: ["admin", "instructor", "student"] },
  { id: "fleet", label: "Fleet Manager", icon: Truck, roles: ["admin", "instructor"] },
  { id: "users", label: "User Manager", icon: ShieldCheck, roles: ["admin"] },
  { id: "analytics", label: "Analytics", icon: LineChart, roles: ["admin"] },
  { id: "profile", label: "Profile", icon: UserCircle2, roles: ["admin", "instructor", "student"] },
];

export default function Sidebar({ active, onChange, role = "instructor" }) {
  const items = ALL_ITEMS.filter((i) => i.roles.includes(role));
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
            data-testid={`sidebar-${item.id}`}
            onClick={() => onChange(item.id)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 ${
              isActive
                ? "bg-[#1D6A4A]/25 border border-[#10b981]/30 text-white"
                : "text-slate-300 hover:bg-white/5 border border-transparent"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-[#10b981] text-[#022c22]" : "bg-white/5 text-slate-300"}`}>
              <Icon className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-medium">{item.label}</div>
            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
          </button>
        );
      })}
      <div className="mt-auto glass-card p-4">
        <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-1">
          Role
        </div>
        <div className="font-heading font-semibold text-sm capitalize">{role}</div>
        <div className="text-[11px] text-slate-400 mt-1">v3.0 · DriveMate</div>
      </div>
    </aside>
  );
}
