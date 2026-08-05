import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { paymentApi } from "@/lib/api";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PaymentResult({ variant }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ payment_status: "pending", status: "initiated" });
  const [attempts, setAttempts] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    if (variant === "cancel") return;
    const sid = new URLSearchParams(location.search).get("session_id");
    if (!sid) { navigate("/dashboard"); return; }

    const poll = async () => {
      try {
        const r = await paymentApi.status(sid);
        setStatus(r.data);
        if (r.data.payment_status === "paid" || r.data.payment_status === "failed" || r.data.payment_status === "expired") {
          clearInterval(pollRef.current);
        }
      } catch {}
      setAttempts((a) => a + 1);
    };
    poll();
    pollRef.current = setInterval(() => {
      setAttempts((prev) => {
        if (prev >= 10) { clearInterval(pollRef.current); return prev; }
        poll();
        return prev;
      });
    }, 2000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line
  }, [variant]);

  if (variant === "cancel") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative">
        <div className="grain-overlay" />
        <div className="glass-card p-10 text-center max-w-md">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="font-heading text-2xl font-bold mb-2">Payment cancelled</h1>
          <p className="text-slate-400 text-sm mb-6">No charge was made. Come back when you're ready.</p>
          <Link to="/dashboard" data-testid="cancel-back-link" className="inline-block px-6 py-3 rounded-full bg-[#10b981] text-[#022c22] font-heading font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const paid = status.payment_status === "paid";
  const failed = status.payment_status === "failed" || status.payment_status === "expired";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative">
      <div className="grain-overlay" />
      <div className="glass-card p-10 text-center max-w-md" data-testid="payment-result">
        {paid ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-[#10b981] mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="font-heading text-2xl font-bold mb-2">Payment successful!</h1>
            <p className="text-slate-300 text-sm mb-1">You're all set — {status.package_name} unlocked.</p>
            <p className="text-slate-400 text-xs mb-6">A receipt is on its way to your email.</p>
          </>
        ) : failed ? (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="font-heading text-2xl font-bold mb-2">Payment failed</h1>
            <p className="text-slate-400 text-sm mb-6">The transaction didn't go through. Please try again.</p>
          </>
        ) : (
          <>
            <Loader2 className="w-14 h-14 text-[#10b981] mx-auto mb-4 animate-spin" strokeWidth={1.5} />
            <h1 className="font-heading text-2xl font-bold mb-2">Confirming your payment…</h1>
            <p className="text-slate-400 text-sm mb-6">This usually takes a few seconds.</p>
          </>
        )}
        <Link to="/dashboard" data-testid="result-back-link" className="inline-block px-6 py-3 rounded-full bg-[#10b981] text-[#022c22] font-heading font-semibold">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
