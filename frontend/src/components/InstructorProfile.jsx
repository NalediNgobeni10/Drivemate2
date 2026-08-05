import { useEffect, useState } from "react";
import { authApi, statsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, Clock, Users, Calendar, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InstructorProfile() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    title: user?.title || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await statsApi.instructor();
        setStats(res.data);
      } catch { toast.error("Failed to load stats"); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      title: user?.title || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    });
  }, [user]);

  const initials = (user?.name || "L L").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const save = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateMe(form);
      setUser(res.data);
      toast.success("Profile updated");
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const cards = [
    { label: "Rating", value: `${(stats?.rating || 4.8).toFixed(1)}`, sub: "/ 5.0", icon: Star, glow: true, testId: "stat-rating" },
    { label: "Total Hours", value: `${stats?.total_hours ?? 142}`, sub: "Hrs", icon: Clock, testId: "stat-hours" },
    { label: "Students", value: `${stats?.total_students ?? 0}`, sub: "active", icon: Users, testId: "stat-students" },
    { label: "Slots", value: `${stats?.total_slots ?? 0}`, sub: "scheduled", icon: Calendar, testId: "stat-slots" },
  ];

  return (
    <section data-testid="instructor-profile" className="reveal">
      <div className="mb-6">
        <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Section 03</div>
        <h2 className="text-3xl font-heading font-bold">Instructor Profile</h2>
        <p className="text-slate-400 text-sm mt-1">Overview of your performance and personal details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity + stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="w-24 h-24 border-2 border-[#10b981]/60 shrink-0">
              <AvatarImage src={user?.picture} alt={user?.name} />
              <AvatarFallback className="bg-[#1D6A4A] text-white font-heading text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-1">
                {user?.role === "admin" ? "Faculty Lead" : "Instructor"}
              </div>
              <h3 className="text-3xl font-heading font-bold">{user?.name || "—"}</h3>
              <div className="text-slate-300 mt-1">{user?.title || "Instructor"}</div>
              <div className="text-slate-400 text-sm mt-2">{user?.email}</div>
              <p className="text-slate-300 mt-4 text-sm leading-relaxed max-w-lg">
                {user?.bio || "Add a short bio so students know a bit about your teaching style."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full py-8 text-center">
                <Loader2 className="w-6 h-6 text-[#10b981] animate-spin mx-auto" />
              </div>
            ) : cards.map(({ label, value, sub, icon: Icon, glow, testId }) => (
              <div
                key={label}
                data-testid={testId}
                className={`glass-card p-5 hover-lift ${glow ? "border-[#10b981]/30" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">
                    {label}
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${glow ? "bg-[#10b981] text-[#022c22]" : "bg-white/5 text-[#10b981]"}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <div className={`font-heading text-4xl font-bold ${glow ? "text-[#10b981]" : "text-slate-100"}`}>
                    {value}
                  </div>
                  <div className="text-slate-400 text-sm">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editable info */}
        <div className="glass-card p-6 space-y-4 h-fit">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-semibold text-xl">Personal Info</h3>
            <span className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Editable</span>
          </div>
          <div>
            <Label className="text-slate-300">Full Name</Label>
            <Input
              data-testid="profile-name-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white/5 border-white/10 text-slate-100 mt-2"
            />
          </div>
          <div>
            <Label className="text-slate-300">Title</Label>
            <Input
              data-testid="profile-title-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-white/5 border-white/10 text-slate-100 mt-2"
            />
          </div>
          <div>
            <Label className="text-slate-300">Phone</Label>
            <Input
              data-testid="profile-phone-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-white/5 border-white/10 text-slate-100 mt-2"
            />
          </div>
          <div>
            <Label className="text-slate-300">Bio</Label>
            <Textarea
              data-testid="profile-bio-input"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="bg-white/5 border-white/10 text-slate-100 mt-2 min-h-[100px]"
            />
          </div>
          <Button
            data-testid="profile-save-btn"
            onClick={save}
            disabled={saving}
            className="w-full h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
          >
            <Save className="w-4 h-4 mr-2" strokeWidth={1.75} />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </section>
  );
}
