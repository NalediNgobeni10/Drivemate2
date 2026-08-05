import { useEffect, useState } from "react";
import { paymentApi } from "@/lib/api";
import { formatZAR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CreditCard, Package, Check, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

const PACKAGE_ORDER = ["single", "starter", "pro", "full"];

export default function Payments() {
  const [packages, setPackages] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([paymentApi.packages(), paymentApi.my()]);
      setPackages(p.data);
      setHistory(m.data);
    } catch { toast.error("Failed to load payments"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const buy = async (pkgId) => {
    setBusyId(pkgId);
    try {
      const r = await paymentApi.checkout({ package_id: pkgId, origin_url: window.location.origin });
      window.location.href = r.data.checkout_url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Checkout failed");
      setBusyId(null);
    }
  };

  return (
    <section data-testid="payments" className="reveal">
      <div className="mb-6">
        <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Lesson Packages</div>
        <h2 className="text-3xl font-heading font-bold">Payments</h2>
        <p className="text-slate-400 text-sm mt-1">Buy lessons in bulk to save. Card details are handled securely by Stripe.</p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
            {PACKAGE_ORDER.filter((k) => packages[k]).map((k, i) => {
              const p = packages[k];
              const featured = k === "pro";
              return (
                <div
                  key={k}
                  data-testid={`pkg-card-${k}`}
                  className={`glass-card p-6 hover-lift ${featured ? "border-[#10b981]/50 neon-glow" : ""}`}
                >
                  {featured && (
                    <div className="mb-3">
                      <span className="neon-badge">Most Popular</span>
                    </div>
                  )}
                  <div className="w-11 h-11 rounded-xl bg-[#1D6A4A] flex items-center justify-center mb-4">
                    <Package className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="font-heading font-bold text-xl">{p.name}</div>
                  <div className="text-slate-400 text-sm mt-1 mb-4">{p.description}</div>
                  <div className="flex items-baseline gap-1.5 mb-5">
                    <span className="font-heading text-4xl font-bold text-[#10b981]">{formatZAR(p.amount)}</span>
                    <span className="text-slate-400 text-xs font-mono-tech uppercase">ZAR</span>
                  </div>
                  <div className="space-y-2 mb-6 text-sm text-slate-300">
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10b981]" strokeWidth={2} />{p.lessons} lesson{p.lessons > 1 ? "s" : ""}</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10b981]" strokeWidth={2} />Email confirmation</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10b981]" strokeWidth={2} />Free cancellation</div>
                  </div>
                  <Button
                    data-testid={`pkg-buy-${k}`}
                    onClick={() => buy(k)}
                    disabled={busyId === k}
                    className="w-full h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
                  >
                    {busyId === k ? "Redirecting…" : "Buy Package"}
                  </Button>
                </div>
              );
            })}
          </div>

          <h3 className="font-heading font-semibold text-lg mb-3 text-slate-100">Purchase History</h3>
          {history.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-400" data-testid="payments-history-empty">
              No purchases yet. Buy your first package above.
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Package</th>
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t, i) => (
                    <tr key={t.session_id} data-testid={`payment-row-${i}`} className="border-b border-white/5">
                      <td className="px-6 py-4 text-slate-100">{t.package_name}</td>
                      <td className="px-6 py-4 font-mono-tech text-slate-100">{formatZAR(t.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-mono-tech uppercase tracking-wider ${
                          t.payment_status === "paid" ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40" :
                          t.payment_status === "pending" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                          "bg-red-500/20 text-red-300 border-red-500/40"
                        }`}>
                          {t.payment_status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                          {t.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{new Date(t.created_at).toLocaleString()}</td>
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
