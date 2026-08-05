// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Car } from "lucide-react";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match?.[1];

    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await authApi.processSession(sessionId);
        setUser(res.data.user);
        window.history.replaceState({}, "", "/dashboard");
        navigate("/dashboard", { replace: true, state: { user: res.data.user } });
      } catch (e) {
        console.error("Auth callback failed", e);
        navigate("/", { replace: true });
      }
    })();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="grain-overlay" />
      <div className="glass-card p-10 flex flex-col items-center gap-4 reveal">
        <div className="w-14 h-14 rounded-2xl bg-[#1D6A4A] flex items-center justify-center neon-glow animate-pulse">
          <Car className="w-7 h-7 text-white" strokeWidth={1.75} />
        </div>
        <div className="font-heading font-semibold text-xl">Signing you in…</div>
        <div className="text-sm text-slate-400">Verifying credentials with DriveMate</div>
      </div>
    </div>
  );
}
