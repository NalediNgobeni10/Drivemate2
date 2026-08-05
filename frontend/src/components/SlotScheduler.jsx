import { Fragment, useEffect, useMemo, useState } from "react";
import { slotApi, vehicleApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, CalendarDays, Clock, Truck, Loader2, Trash2, Send, LayoutList, LayoutGrid, CheckCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const statusStyles = {
  Available: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40",
  Booked: "bg-[#1D6A4A]/40 text-emerald-100 border-[#1D6A4A]",
  Completed: "bg-slate-700/40 text-slate-300 border-slate-600",
};

const HOURS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day); // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function isoDate(d) {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function shortDay(d) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function shortDate(d) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function SlotScheduler() {
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list"); // list | week
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [running, setRunning] = useState(false);

  const [form, setForm] = useState({
    date: "",
    time: "",
    vehicle_id: "",
    status: "Available",
    student_name: "",
    student_email: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, vRes] = await Promise.all([slotApi.list(), vehicleApi.list()]);
      setSlots(sRes.data);
      setVehicles(vRes.data);
      if (!form.vehicle_id && vRes.data[0]) {
        setForm((f) => ({ ...f, vehicle_id: vRes.data[0].id }));
      }
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const vehicleLabel = (id) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make_model} - ${v.license_plate}` : "";
  };

  const submit = async () => {
    if (!form.date || !form.time || !form.vehicle_id) {
      return toast.error("Date, time and vehicle required");
    }
    setSaving(true);
    try {
      await slotApi.create({ ...form, vehicle: vehicleLabel(form.vehicle_id) });
      toast.success("Slot added");
      setOpen(false);
      setForm({ date: "", time: "", vehicle_id: vehicles[0]?.id || "", status: "Available", student_name: "", student_email: "" });
      await load();
    } catch { toast.error("Failed to add slot"); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await slotApi.remove(id); toast.success("Slot removed"); await load(); }
    catch { toast.error("Failed to remove"); }
  };

  const sendReminder = async (id) => {
    try {
      const r = await slotApi.sendReminder(id);
      toast.success(`Reminder sent to ${r.data.sent_to}`);
      await load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = typeof detail === "string" && detail.length < 200 ? detail : "Reminder could not be sent right now";
      toast.error(msg);
    }
  };

  const runAll = async () => {
    setRunning(true);
    try {
      const r = await slotApi.runReminders();
      toast.success(`Reminder job: sent ${r.data.sent}, skipped ${r.data.skipped}`);
      await load();
    } catch { toast.error("Reminder job failed"); }
    finally { setRunning(false); }
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const slotsByCell = useMemo(() => {
    const map = {};
    for (const s of slots) {
      const key = `${s.date}|${s.time.slice(0,5)}`;
      map[key] = s;
    }
    return map;
  }, [slots]);

  const openAddForCell = (date, time) => {
    setForm((f) => ({ ...f, date, time, vehicle_id: f.vehicle_id || vehicles[0]?.id || "" }));
    setOpen(true);
  };

  return (
    <section data-testid="slot-scheduler" className="reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Section 02</div>
          <h2 className="text-3xl font-heading font-bold">Calendar Slot Scheduler</h2>
          <p className="text-slate-400 text-sm mt-1">Manage lesson availability by date, time and vehicle.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
            <button
              data-testid="scheduler-view-list"
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors ${view === "list" ? "bg-[#10b981] text-[#022c22]" : "text-slate-300"}`}
            >
              <LayoutList className="w-3.5 h-3.5" strokeWidth={1.75} /> List
            </button>
            <button
              data-testid="scheduler-view-week"
              onClick={() => setView("week")}
              className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors ${view === "week" ? "bg-[#10b981] text-[#022c22]" : "text-slate-300"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} /> Week
            </button>
          </div>
          <Button
            data-testid="scheduler-run-reminders-btn"
            variant="ghost"
            onClick={runAll}
            disabled={running}
            className="h-11 rounded-full text-[#10b981] hover:text-[#022c22] hover:bg-[#10b981] font-heading font-semibold"
          >
            <CheckCheck className="w-4 h-4 mr-1.5" strokeWidth={1.75} />
            {running ? "Sending…" : "Run 24h Reminders"}
          </Button>
          <Button
            data-testid="scheduler-add-slot-btn"
            onClick={() => setOpen(true)}
            className="h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={2} /> Add New Slot
          </Button>
        </div>
      </div>

      {view === "list" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" data-testid="slots-table">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Vehicle</th>
                  <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-[#10b981] animate-spin mx-auto" />
                  </td></tr>
                ) : slots.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">No slots yet.</td></tr>
                ) : slots.map((s, idx) => (
                  <tr key={s.id} data-testid={`slot-row-${idx}`} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-100">
                        <CalendarDays className="w-4 h-4 text-[#10b981]" strokeWidth={1.5} />
                        <span className="font-heading font-semibold">{s.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        <span className="font-mono-tech">{s.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Truck className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        <span className="text-sm">{s.vehicle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-300">
                      {s.student_name || <span className="text-slate-500">—</span>}
                      {s.reminder_sent_at && (
                        <div className="text-[10px] font-mono-tech text-[#10b981] mt-0.5">✓ reminder sent</div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        data-testid={`slot-status-${idx}`}
                        className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-mono-tech uppercase tracking-wider ${statusStyles[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1 justify-end">
                        {s.status === "Booked" && (
                          <button
                            data-testid={`slot-reminder-${idx}`}
                            onClick={() => sendReminder(s.id)}
                            className="text-slate-400 hover:text-[#10b981] transition-colors p-2 rounded-full hover:bg-white/5"
                            title="Send reminder email"
                          >
                            <Send className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          data-testid={`slot-delete-${idx}`}
                          onClick={() => remove(s.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="glass-card p-4" data-testid="scheduler-week-view">
          <div className="flex items-center justify-between mb-4">
            <button
              data-testid="week-prev-btn"
              onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#10b981]/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" strokeWidth={1.5} />
            </button>
            <div className="font-heading font-semibold text-slate-100">
              {shortDate(weekStart)} → {shortDate(weekDays[6])}
            </div>
            <button
              data-testid="week-next-btn"
              onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#10b981]/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={1.5} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[900px] grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-1">
              <div />
              {weekDays.map((d, i) => (
                <div key={i} className="text-center pb-2 border-b border-white/10">
                  <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">{shortDay(d)}</div>
                  <div className="font-heading font-semibold text-slate-100">{shortDate(d)}</div>
                </div>
              ))}
              {HOURS.map((h) => (
                <Fragment key={`row-${h}`}>
                  <div className="text-right pr-2 py-2 font-mono-tech text-xs text-slate-400">{h}</div>
                  {weekDays.map((d, di) => {
                    const key = `${isoDate(d)}|${h}`;
                    const slot = slotsByCell[key];
                    if (!slot) {
                      return (
                        <button
                          key={`c-${h}-${di}`}
                          data-testid={`week-cell-${isoDate(d)}-${h}`}
                          onClick={() => openAddForCell(isoDate(d), h)}
                          className="h-16 rounded-lg border border-dashed border-white/5 hover:border-[#10b981]/40 hover:bg-white/[0.03] transition-colors flex items-center justify-center text-slate-600 hover:text-[#10b981] text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      );
                    }
                    const s = slot;
                    const bg = s.status === "Available" ? "bg-[#10b981]/15 border-[#10b981]/40" :
                               s.status === "Booked" ? "bg-[#1D6A4A]/40 border-[#1D6A4A]" :
                               "bg-slate-700/30 border-slate-600";
                    return (
                      <div
                        key={`s-${s.id}`}
                        data-testid={`week-slot-${s.id}`}
                        className={`h-16 rounded-lg border ${bg} p-2 text-[11px] flex flex-col justify-between overflow-hidden`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono-tech text-[9px] uppercase tracking-wider text-slate-200">{s.status}</span>
                          {s.status === "Booked" && (
                            <button onClick={() => sendReminder(s.id)} className="text-slate-300 hover:text-[#10b981]" title="Send reminder">
                              <Send className="w-3 h-3" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                        <div className="text-slate-100 truncate font-semibold">
                          {s.student_name || s.vehicle.split(" - ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="add-slot-modal" className="bg-slate-900 border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="font-heading">Add New Slot</DialogTitle>
            <DialogDescription className="text-slate-400">Block off a lesson slot on the calendar.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Date</Label>
              <Input
                data-testid="new-slot-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div>
              <Label className="text-slate-300">Time</Label>
              <Input
                data-testid="new-slot-time"
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-300">Vehicle</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger data-testid="new-slot-vehicle" className="bg-white/5 border-white/10 mt-2">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} · {v.make_model} · {v.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="new-slot-status" className="bg-white/5 border-white/10 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Student Name</Label>
              <Input
                data-testid="new-slot-student"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-300">Student Email (for reminders)</Label>
              <Input
                data-testid="new-slot-student-email"
                type="email"
                value={form.student_email}
                onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                placeholder="student@example.com"
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-300 hover:bg-white/5">Cancel</Button>
            <Button
              data-testid="new-slot-submit"
              onClick={submit}
              disabled={saving}
              className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
            >{saving ? "Saving…" : "Create Slot"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
