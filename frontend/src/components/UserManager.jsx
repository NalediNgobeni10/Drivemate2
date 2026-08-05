import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const roleColors = {
  admin: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40",
  instructor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  student: "bg-slate-700/40 text-slate-300 border-slate-600",
};

export default function UserManager() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listUsers();
      setUsers(r.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    setBusyId(id);
    try {
      await adminApi.updateUser(id, { role });
      toast.success("Role updated");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    } finally { setBusyId(null); }
  };

  const remove = async (id) => {
    setBusyId(id);
    try {
      await adminApi.deleteUser(id);
      toast.success("User removed");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    } finally { setBusyId(null); }
  };

  return (
    <section data-testid="user-manager" className="reveal">
      <div className="mb-6">
        <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Admin Only</div>
        <h2 className="text-3xl font-heading font-bold flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-[#10b981]" strokeWidth={1.75} />
          User Manager
        </h2>
        <p className="text-slate-400 text-sm mt-1">Promote, demote, or remove users. You cannot demote or delete yourself.</p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left" data-testid="users-table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Current Role</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Change Role</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const isMe = u.user_id === me?.user_id;
                const initials = (u.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={u.user_id} data-testid={`user-row-${idx}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-white/10">
                          <AvatarImage src={u.picture} alt={u.name} />
                          <AvatarFallback className="bg-[#1D6A4A] text-white text-xs font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-heading font-semibold text-slate-100">
                            {u.name}
                            {isMe && <span className="ml-2 text-[10px] text-[#10b981] font-mono-tech uppercase">(you)</span>}
                          </div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-mono-tech uppercase tracking-wider ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={u.role}
                        onValueChange={(v) => changeRole(u.user_id, v)}
                        disabled={isMe || busyId === u.user_id}
                      >
                        <SelectTrigger data-testid={`user-role-${idx}`} className="bg-white/5 border-white/10 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        data-testid={`user-delete-${idx}`}
                        variant="ghost"
                        onClick={() => remove(u.user_id)}
                        disabled={isMe || busyId === u.user_id}
                        className="text-slate-400 hover:text-red-400 hover:bg-white/5 h-9 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
