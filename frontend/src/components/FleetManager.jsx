import { useEffect, useState } from "react";
import { vehicleApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Truck, Wrench, Loader2, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusStyles = {
  Active: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40",
  "Service Due": "bg-amber-500/20 text-amber-300 border-amber-500/40",
  "In Service": "bg-blue-500/20 text-blue-300 border-blue-500/40",
  Retired: "bg-slate-700/40 text-slate-400 border-slate-600",
};

export default function FleetManager() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    make_model: "",
    license_plate: "",
    license_class: "Code 8",
    service_interval_hours: 100,
    color: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await vehicleApi.list();
      setVehicles(res.data);
    } catch { toast.error("Failed to load fleet"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name || !form.make_model || !form.license_plate) {
      return toast.error("Name, model and plate required");
    }
    setSaving(true);
    try {
      await vehicleApi.create(form);
      toast.success("Vehicle added to fleet");
      setOpen(false);
      setForm({ name: "", make_model: "", license_plate: "", license_class: "Code 8", service_interval_hours: 100, color: "" });
      await load();
    } catch { toast.error("Failed to add vehicle"); }
    finally { setSaving(false); }
  };

  const markServiced = async (id) => {
    try {
      await vehicleApi.service(id);
      toast.success("Vehicle marked as serviced");
      await load();
    } catch { toast.error("Failed"); }
  };

  const remove = async (id) => {
    try {
      await vehicleApi.remove(id);
      toast.success("Vehicle removed");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };

  const serviceDueCount = vehicles.filter((v) => v.status === "Service Due").length;

  return (
    <section data-testid="fleet-manager" className="reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Section 03</div>
          <h2 className="text-3xl font-heading font-bold">Fleet Manager</h2>
          <p className="text-slate-400 text-sm mt-1">Track vehicle hours and get flagged when a service is due.</p>
        </div>
        <div className="flex items-center gap-3">
          {serviceDueCount > 0 && (
            <div className="glass-card px-4 py-2 flex items-center gap-2 border-amber-500/30" data-testid="fleet-service-due-banner">
              <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
              <span className="text-sm text-amber-200">{serviceDueCount} vehicle{serviceDueCount > 1 ? "s" : ""} due for service</span>
            </div>
          )}
          <Button
            data-testid="fleet-add-vehicle-btn"
            onClick={() => setOpen(true)}
            className="h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={2} /> Add Vehicle
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-[#10b981] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {vehicles.length === 0 ? (
            <div className="col-span-full glass-card p-12 text-center text-slate-400">
              No vehicles yet. Add your first one to start tracking hours.
            </div>
          ) : vehicles.map((v, idx) => {
            const svcPct = Math.min(100, Math.round((v.hours_since_service / v.service_interval_hours) * 100));
            const isDue = v.status === "Service Due";
            return (
              <div
                key={v.id}
                data-testid={`fleet-card-${idx}`}
                className={`glass-card p-6 hover-lift ${isDue ? "border-amber-500/40" : ""}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDue ? "bg-amber-500/20" : "bg-[#1D6A4A]"}`}>
                      <Truck className={`w-5 h-5 ${isDue ? "text-amber-300" : "text-white"}`} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-lg text-slate-100">{v.name}</div>
                      <div className="text-xs text-slate-400">{v.make_model}</div>
                    </div>
                  </div>
                  <span
                    data-testid={`fleet-status-${idx}`}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-mono-tech uppercase tracking-wider ${statusStyles[v.status]}`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono-tech tracking-wider">{v.license_plate}</span>
                  <span className="neon-badge text-[10px]">{v.license_class}</span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-mono-tech uppercase tracking-wider">Service</span>
                      <span className={`font-mono-tech ${isDue ? "text-amber-300" : "text-[#10b981]"}`}>
                        {Math.round(v.hours_since_service)} / {v.service_interval_hours} hrs
                      </span>
                    </div>
                    <Progress
                      value={svcPct}
                      className={`h-2 bg-slate-800 ${isDue ? "[&>*]:bg-amber-400" : "[&>*]:bg-[#1D6A4A]"}`}
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="font-heading text-3xl font-bold text-slate-100">{Math.round(v.total_hours)}</div>
                    <div className="text-xs text-slate-400 font-mono-tech uppercase tracking-widest">total hours driven</div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    data-testid={`fleet-service-btn-${idx}`}
                    onClick={() => markServiced(v.id)}
                    variant="ghost"
                    className={`flex-1 h-9 rounded-full ${isDue ? "bg-amber-500 text-slate-900 hover:bg-amber-400" : "text-[#10b981] hover:text-[#022c22] hover:bg-[#10b981]"}`}
                  >
                    {isDue ? <Wrench className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> : <CheckCircle2 className="w-4 h-4 mr-1.5" strokeWidth={1.5} />}
                    {isDue ? "Mark Serviced" : "Reset Counter"}
                  </Button>
                  <button
                    data-testid={`fleet-delete-${idx}`}
                    onClick={() => remove(v.id)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="add-vehicle-modal" className="bg-slate-900 border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Vehicle to Fleet</DialogTitle>
            <DialogDescription className="text-slate-400">Register a new car or truck for lessons.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Fleet Name</Label>
              <Input
                data-testid="new-vehicle-name"
                placeholder="Fleet-04"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div>
              <Label className="text-slate-300">Make & Model</Label>
              <Input
                data-testid="new-vehicle-model"
                placeholder="Toyota Yaris"
                value={form.make_model}
                onChange={(e) => setForm({ ...form, make_model: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div>
              <Label className="text-slate-300">License Plate</Label>
              <Input
                data-testid="new-vehicle-plate"
                placeholder="CA 999-999"
                value={form.license_plate}
                onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div>
              <Label className="text-slate-300">Class</Label>
              <Select value={form.license_class} onValueChange={(v) => setForm({ ...form, license_class: v })}>
                <SelectTrigger data-testid="new-vehicle-class" className="bg-white/5 border-white/10 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                  <SelectItem value="Code 8">Code 8</SelectItem>
                  <SelectItem value="Code 10">Code 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Service Interval (hrs)</Label>
              <Input
                data-testid="new-vehicle-interval"
                type="number"
                value={form.service_interval_hours}
                onChange={(e) => setForm({ ...form, service_interval_hours: Number(e.target.value) })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div>
              <Label className="text-slate-300">Colour</Label>
              <Input
                data-testid="new-vehicle-color"
                placeholder="Silver"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-300 hover:bg-white/5">Cancel</Button>
            <Button
              data-testid="new-vehicle-submit"
              onClick={submit}
              disabled={saving}
              className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
            >{saving ? "Adding…" : "Add Vehicle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
