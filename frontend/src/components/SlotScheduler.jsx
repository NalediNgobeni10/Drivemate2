import { useEffect, useState } from "react";
import { slotApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, CalendarDays, Clock, Truck, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusStyles = {
  Available: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40",
  Booked: "bg-[#1D6A4A]/40 text-emerald-100 border-[#1D6A4A]",
  Completed: "bg-slate-700/40 text-slate-300 border-slate-600",
};

export default function SlotScheduler() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    vehicle: "Toyota Corolla - CA 123-456",
    status: "Available",
    student_name: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await slotApi.list();
      setSlots(res.data);
    } catch { toast.error("Failed to load slots"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.date || !form.time || !form.vehicle) {
      return toast.error("Date, time and vehicle required");
    }
    setSaving(true);
    try {
      await slotApi.create(form);
      toast.success("Slot added");
      setOpen(false);
      setForm({ date: "", time: "", vehicle: "Toyota Corolla - CA 123-456", status: "Available", student_name: "" });
      await load();
    } catch { toast.error("Failed to add slot"); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      await slotApi.remove(id);
      toast.success("Slot removed");
      await load();
    } catch { toast.error("Failed to remove"); }
  };

  return (
    <section data-testid="slot-scheduler" className="reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Section 02</div>
          <h2 className="text-3xl font-heading font-bold">Calendar Slot Scheduler</h2>
          <p className="text-slate-400 text-sm mt-1">Manage lesson availability by date, time, and vehicle.</p>
        </div>
        <Button
          data-testid="scheduler-add-slot-btn"
          onClick={() => setOpen(true)}
          className="h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" strokeWidth={2} /> Add New Slot
        </Button>
      </div>

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
                <th className="px-6 py-4"></th>
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
                  </td>
                  <td className="px-6 py-5">
                    <span
                      data-testid={`slot-status-${idx}`}
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-mono-tech uppercase tracking-wider ${statusStyles[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      data-testid={`slot-delete-${idx}`}
                      onClick={() => remove(s.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              <Select value={form.vehicle} onValueChange={(v) => setForm({ ...form, vehicle: v })}>
                <SelectTrigger data-testid="new-slot-vehicle" className="bg-white/5 border-white/10 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                  <SelectItem value="Toyota Corolla - CA 123-456">Toyota Corolla - CA 123-456</SelectItem>
                  <SelectItem value="VW Polo - CA 345-678">VW Polo - CA 345-678</SelectItem>
                  <SelectItem value="Isuzu Truck - CA 789-012">Isuzu Truck - CA 789-012</SelectItem>
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
              <Label className="text-slate-300">Student (optional)</Label>
              <Input
                data-testid="new-slot-student"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
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
