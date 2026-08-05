import { useEffect, useMemo, useState } from "react";
import { slotApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, Truck, Loader2, Search, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export default function BookLesson() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await slotApi.list();
      setSlots(r.data.filter((s) => s.status === "Available"));
    } catch { toast.error("Failed to load slots"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const book = async (id) => {
    setBusyId(id);
    try {
      await slotApi.book(id);
      toast.success("Booked! A confirmation email is on its way.");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not book slot");
    } finally { setBusyId(null); }
  };

  const filtered = useMemo(() => {
    if (!q) return slots;
    const t = q.toLowerCase();
    return slots.filter((s) => s.vehicle.toLowerCase().includes(t) || s.date.includes(t));
  }, [slots, q]);

  return (
    <section data-testid="book-lesson" className="reveal">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Available Slots</div>
          <h2 className="text-3xl font-heading font-bold">Book a Lesson</h2>
          <p className="text-slate-400 text-sm mt-1">Pick any open time. You'll get an instant email confirmation.</p>
        </div>
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
          <Input
            data-testid="book-search"
            placeholder="Search by date or vehicle…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 h-10 text-slate-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400" data-testid="book-empty">
          No available slots right now. Please check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s, idx) => (
            <div key={s.id} data-testid={`book-card-${idx}`} className="glass-card p-6 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#10b981]" strokeWidth={1.5} />
                  <span className="font-heading font-semibold text-slate-100">{s.date}</span>
                </div>
                <span className="neon-badge">AVAILABLE</span>
              </div>
              <div className="flex items-center gap-2 text-slate-100 mb-3">
                <Clock className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <span className="font-mono-tech text-lg">{s.time}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                <Truck className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <span>{s.vehicle}</span>
              </div>
              {s.instructor_id && (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <UserIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Instructor assigned</span>
                </div>
              )}
              <Button
                data-testid={`book-btn-${idx}`}
                onClick={() => book(s.id)}
                disabled={busyId === s.id}
                className="mt-5 w-full h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
              >
                {busyId === s.id ? "Booking…" : "Book this lesson"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
