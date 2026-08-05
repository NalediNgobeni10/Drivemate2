import { useEffect, useState } from "react";
import { statsApi, adminApi } from "@/lib/api";
import { formatZAR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Users, CalendarCheck, DollarSign, Truck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    try {
      const [a, p] = await Promise.all([statsApi.adminAnalytics(), adminApi.payments()]);
      setStats(a.data);
      setPayments(p.data);
    } catch { toast.error("Failed to load analytics"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetDemo = async () => {
    if (!window.confirm("Reset all demo data (students, slots, vehicles, payments, messages)? Users are preserved.")) return;
    setResetting(true);
    try {
      await adminApi.resetDemo();
      toast.success("Fresh demo data loaded — ready to present!");
      await load();
    } catch { toast.error("Failed to reset"); }
    finally { setResetting(false); }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>;
  if (!stats) return null;

  const cards = [
    { label: "Revenue (paid)", value: formatZAR(stats.revenue.total, { compact: true }), sub: `${stats.revenue.transactions} txns`, icon: DollarSign, glow: true, testId: "an-revenue" },
    { label: "Users", value: stats.users.total, sub: `${stats.users.students} students · ${stats.users.instructors} instructors`, icon: Users, testId: "an-users" },
    { label: "Bookings", value: stats.slots.booked, sub: `${stats.slots.completed} completed / ${stats.slots.available} open`, icon: CalendarCheck, testId: "an-bookings" },
    { label: "Fleet", value: stats.fleet.total, sub: `${stats.fleet.service_due} due for service`, icon: Truck, testId: "an-fleet" },
  ];

  return (
    <section data-testid="analytics" className="reveal">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Admin Only</div>
          <h2 className="text-3xl font-heading font-bold">Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">A high-level pulse of the whole operation.</p>
        </div>
        <Button
          data-testid="analytics-reset-demo"
          onClick={resetDemo}
          disabled={resetting}
          variant="ghost"
          className="h-10 rounded-full text-[#10b981] hover:text-[#022c22] hover:bg-[#10b981] font-heading font-semibold"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${resetting ? "animate-spin" : ""}`} strokeWidth={1.75} />
          {resetting ? "Resetting…" : "Reset Demo Data"}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, value, sub, icon: Icon, glow, testId }) => (
          <div key={label} data-testid={testId} className={`glass-card p-5 hover-lift ${glow ? "border-[#10b981]/30" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">{label}</div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${glow ? "bg-[#10b981] text-[#022c22]" : "bg-white/5 text-[#10b981]"}`}>
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
            <div className={`font-heading text-4xl font-bold ${glow ? "text-[#10b981]" : "text-slate-100"}`}>{value}</div>
            <div className="text-slate-400 text-xs mt-1.5">{sub}</div>
          </div>
        ))}
      </div>

      <h3 className="font-heading font-semibold text-lg mb-3 text-slate-100">Recent Transactions</h3>
      {payments.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-400">No transactions yet.</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Package</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 20).map((t, i) => (
                <tr key={t.session_id} data-testid={`admin-payment-${i}`} className="border-b border-white/5">
                  <td className="px-6 py-4 text-slate-300 text-sm">{t.user_email}</td>
                  <td className="px-6 py-4 text-slate-100">{t.package_name}</td>
                  <td className="px-6 py-4 font-mono-tech text-slate-100">{formatZAR(t.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-mono-tech uppercase tracking-wider ${
                      t.payment_status === "paid" ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40" :
                      "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}>{t.payment_status}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-xs">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
