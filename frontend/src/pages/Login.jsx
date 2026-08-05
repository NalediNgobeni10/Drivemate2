// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import { Car, GaugeCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGIN_IMG = "https://images.pexels.com/photos/19477337/pexels-photo-19477337.jpeg";

export default function Login() {
  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#0f172a] relative">
      <div className="grain-overlay" />
      {/* Left panel */}
      <div className="relative z-10 flex flex-col justify-between p-8 lg:p-14">
        <div className="flex items-center gap-3 reveal">
          <div className="w-10 h-10 rounded-xl bg-[#1D6A4A] flex items-center justify-center neon-glow">
            <Car className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-heading font-bold text-xl tracking-tight">DriveMate</div>
            <div className="font-mono-tech text-[10px] text-slate-400 uppercase">Driving School · Management Suite</div>
          </div>
        </div>

        <div className="max-w-lg reveal reveal-delay-2">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="font-mono-tech text-[11px] text-slate-300 uppercase tracking-wider">Instructor Portal · v2.0</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-heading font-bold leading-[1.05] mb-6">
            Drive lessons, <br />
            <span className="text-[#10b981]">managed brilliantly.</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-md">
            One dashboard for your roster, availability, and student progress across Code 8 and Code 10 tracks.
          </p>

          <Button
            data-testid="login-google-btn"
            onClick={handleGoogleLogin}
            className="group h-14 px-8 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold text-base"
          >
            Continue with Google
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2} />
          </Button>

          <div className="grid grid-cols-3 gap-3 mt-12">
            {[
              { icon: GaugeCircle, label: "Live progress" },
              { icon: ShieldCheck, label: "Secure sessions" },
              { icon: Car, label: "Fleet ready" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={label} className={`glass-card p-4 hover-lift reveal reveal-delay-${i + 2}`}>
                <Icon className="w-5 h-5 text-[#10b981] mb-2" strokeWidth={1.5} />
                <div className="text-xs text-slate-300">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono-tech uppercase tracking-wider">
          © 2026 DriveMate · Built for Instructors
        </div>
      </div>

      {/* Right panel: image */}
      <div className="hidden lg:block relative overflow-hidden">
        <img src={LOGIN_IMG} alt="Steering wheel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/60 to-transparent" />
        <div className="absolute inset-0 bg-[#0f172a]/30" />
        <div className="absolute bottom-14 right-14 max-w-sm glass-card p-6 reveal reveal-delay-3">
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-wider mb-2">Today · 08:12</div>
          <div className="font-heading font-semibold text-lg mb-1">142 lesson hours</div>
          <div className="text-sm text-slate-300">delivered by our top instructor this term.</div>
        </div>
      </div>
    </div>
  );
}
