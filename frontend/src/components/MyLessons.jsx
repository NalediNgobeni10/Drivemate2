import { useEffect, useState } from "react";
import { slotApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Truck, Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const statusStyles = {
  Available: "bg-slate-700/40 text-slate-300 border-slate-600",
  Booked: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40",
  Completed: "bg-[#1D6A4A]/40 text-emerald-100 border-[#1D6A4A]",
};

export default function MyLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await slotApi.myLessons();
      setLessons(r.data);
    } catch { toast.error("Failed to load lessons"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    setBusyId(id);
    try {
      await slotApi.cancel(id);
      toast.success("Lesson cancelled");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not cancel");
    } finally { setBusyId(null); }
  };

  const upcoming = lessons.filter((l) => l.status === "Booked");
  const history = lessons.filter((l) => l.status === "Completed");

  return (
    <section data-testid="my-lessons" className="reveal">
      <div className="mb-6">
        <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Your Journey</div>
        <h2 className="text-3xl font-heading font-bold">My Lessons</h2>
        <p className="text-slate-400 text-sm mt-1">Upcoming lessons and your training history.</p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>
      ) : (
        <>
          <h3 className="font-heading font-semibold text-lg mb-3 text-slate-100">Upcoming</h3>
          {upcoming.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-400 mb-8" data-testid="upcoming-empty">
              No upcoming lessons. Book one from the Book Lesson tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
              {upcoming.map((l, idx) => (
                <div key={l.id} data-testid={`my-upcoming-${idx}`} className="glass-card p-5 hover-lift">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-100">
                      <CalendarDays className="w-4 h-4 text-[#10b981]" strokeWidth={1.5} />
                      <span className="font-heading font-semibold">{l.date}</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-mono-tech uppercase tracking-wider ${statusStyles[l.status]}`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-100 mb-2">
                    <Clock className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                    <span className="font-mono-tech">{l.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <Truck className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                    <span>{l.vehicle}</span>
                  </div>
                  <Button
                    data-testid={`my-cancel-${idx}`}
                    onClick={() => cancel(l.id)}
                    disabled={busyId === l.id}
                    variant="ghost"
                    className="mt-4 w-full h-9 rounded-full text-red-300 hover:text-white hover:bg-red-500/20"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                    {busyId === l.id ? "Cancelling…" : "Cancel lesson"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <h3 className="font-heading font-semibold text-lg mb-3 text-slate-100">History</h3>
          {history.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-400" data-testid="history-empty">
              No completed lessons yet.
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Vehicle</th>
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((l, i) => (
                    <tr key={l.id} data-testid={`my-history-${i}`} className="border-b border-white/5">
                      <td className="px-6 py-4 text-slate-100">{l.date}</td>
                      <td className="px-6 py-4 font-mono-tech text-slate-100">{l.time}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{l.vehicle}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[#10b981] text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
