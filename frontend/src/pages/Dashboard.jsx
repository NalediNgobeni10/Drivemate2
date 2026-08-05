import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Sidebar from "@/components/Sidebar";
import InstructorRoster from "@/components/InstructorRoster";
import SlotScheduler from "@/components/SlotScheduler";
import FleetManager from "@/components/FleetManager";
import InstructorProfile from "@/components/InstructorProfile";
import BookLesson from "@/components/BookLesson";
import MyLessons from "@/components/MyLessons";
import Payments from "@/components/Payments";
import UserManager from "@/components/UserManager";
import Analytics from "@/components/Analytics";
import Messages from "@/components/Messages";
import { useAuth } from "@/context/AuthContext";
import { GaugeCircle } from "lucide-react";

const DEFAULT_TAB_BY_ROLE = {
  admin: "analytics",
  instructor: "roster",
  student: "book",
};

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "instructor";
  const [tab, setTab] = useState(DEFAULT_TAB_BY_ROLE[role] || "roster");
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    // If user changes role or first load, ensure tab is valid
    setTab(DEFAULT_TAB_BY_ROLE[role] || "roster");
  }, [role]);

  const roleLabel = role === "admin" ? "Admin Console" : role === "instructor" ? "Instructor Console" : "Student Portal";

  return (
    <div className="min-h-screen bg-[#0f172a] relative">
      <div className="grain-overlay" />
      <AppHeader onSearch={setGlobalSearch} />

      <div className="flex">
        <Sidebar active={tab} onChange={setTab} role={role} />

        <main className="flex-1 min-w-0 px-6 lg:px-10 py-10 relative z-10">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">
                {roleLabel}
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading font-bold leading-tight">
                Hello, <span className="text-[#10b981]">{(user?.name || "there").split(" ")[0]}</span>.
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-lg">
                {role === "student" ? "Book lessons, track progress, and chat with your instructor."
                  : role === "admin" ? "Full visibility across users, bookings, payments, and fleet."
                  : "Manage your roster, availability, fleet, and profile — all in one place."}
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

          {/* Mobile tab switcher */}
          <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto">
            {[
              role === "student" && { id: "book", label: "Book" },
              role === "student" && { id: "my-lessons", label: "My Lessons" },
              (role === "instructor" || role === "admin") && { id: "roster", label: "Roster" },
              (role === "instructor" || role === "admin") && { id: "scheduler", label: "Slots" },
              (role === "admin" || role === "student") && { id: "payments", label: "Payments" },
              { id: "messages", label: "Messages" },
              (role === "instructor" || role === "admin") && { id: "fleet", label: "Fleet" },
              role === "admin" && { id: "users", label: "Users" },
              role === "admin" && { id: "analytics", label: "Analytics" },
              { id: "profile", label: "Profile" },
            ].filter(Boolean).map((t) => (
              <button
                key={t.id}
                data-testid={`mobile-tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                  tab === t.id ? "bg-[#10b981] text-[#022c22] border-[#10b981]" : "bg-white/5 text-slate-300 border-white/10"
                }`}
              >{t.label}</button>
            ))}
          </div>

          {tab === "roster" && <InstructorRoster searchQuery={globalSearch} />}
          {tab === "scheduler" && <SlotScheduler />}
          {tab === "book" && <BookLesson />}
          {tab === "my-lessons" && <MyLessons />}
          {tab === "payments" && <Payments />}
          {tab === "messages" && <Messages />}
          {tab === "fleet" && <FleetManager />}
          {tab === "users" && <UserManager />}
          {tab === "analytics" && <Analytics />}
          {tab === "profile" && <InstructorProfile />}
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
