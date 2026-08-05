import { useEffect, useRef, useState } from "react";
import { messageApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Messages() {
  const { user } = useAuth();
  const [directory, setDirectory] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activePeer, setActivePeer] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const loadDirectory = async () => {
    try {
      const [d, t] = await Promise.all([messageApi.directory(), messageApi.threads()]);
      setDirectory(d.data);
      setThreads(t.data);
    } catch { toast.error("Failed to load contacts"); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadDirectory(); }, []);

  const loadThread = async (peer) => {
    setActivePeer(peer);
    try {
      const r = await messageApi.with(peer.user_id || peer.peer_id);
      setMsgs(r.data);
      setTimeout(() => scrollRef.current?.scrollTo(0, 999999), 100);
    } catch { toast.error("Failed to load messages"); }
  };

  // poll every 5 seconds while a thread is open
  useEffect(() => {
    if (!activePeer) return;
    const iv = setInterval(async () => {
      try {
        const r = await messageApi.with(activePeer.user_id || activePeer.peer_id);
        setMsgs(r.data);
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [activePeer]);

  const send = async () => {
    if (!text.trim() || !activePeer) return;
    try {
      await messageApi.send({ to_user_id: activePeer.user_id || activePeer.peer_id, body: text.trim() });
      setText("");
      const r = await messageApi.with(activePeer.user_id || activePeer.peer_id);
      setMsgs(r.data);
      setTimeout(() => scrollRef.current?.scrollTo(0, 999999), 100);
    } catch { toast.error("Failed to send"); }
  };

  const contacts = directory.length ? directory : threads.map((t) => ({ user_id: t.peer_id, name: t.peer_name, role: t.peer_role, picture: t.peer_picture }));

  return (
    <section data-testid="messages" className="reveal">
      <div className="mb-6">
        <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">Direct Chat</div>
        <h2 className="text-3xl font-heading font-bold">Messages</h2>
        <p className="text-slate-400 text-sm mt-1">Talk to instructors and students privately.</p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 h-[540px]">
          {/* Contacts list */}
          <div className="glass-card p-3 overflow-y-auto" data-testid="messages-contacts">
            {contacts.length === 0 ? (
              <div className="text-center text-slate-400 py-8 text-sm">No contacts yet.</div>
            ) : contacts.map((c) => {
              const id = c.user_id || c.peer_id;
              const isActive = (activePeer?.user_id || activePeer?.peer_id) === id;
              const initials = (c.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
              return (
                <button
                  key={id}
                  data-testid={`message-contact-${id}`}
                  onClick={() => loadThread(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isActive ? "bg-[#1D6A4A]/25 border border-[#10b981]/30" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Avatar className="w-9 h-9 border border-white/10">
                    <AvatarImage src={c.picture} alt={c.name} />
                    <AvatarFallback className="bg-[#1D6A4A] text-white text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-sm text-slate-100 truncate">{c.name}</div>
                    <div className="text-[10px] font-mono-tech uppercase tracking-widest text-slate-400">{c.role}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat window */}
          <div className="glass-card flex flex-col overflow-hidden">
            {!activePeer ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-600" strokeWidth={1.25} />
                <div className="text-sm">Pick a contact to start chatting</div>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-[#10b981]/40">
                    <AvatarImage src={activePeer.picture || activePeer.peer_picture} alt={activePeer.name} />
                    <AvatarFallback className="bg-[#1D6A4A] text-white text-xs">
                      {(activePeer.name || activePeer.peer_name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-heading font-semibold text-slate-100">{activePeer.name || activePeer.peer_name}</div>
                    <div className="text-[10px] text-[#10b981] font-mono-tech uppercase tracking-widest">{activePeer.role || activePeer.peer_role}</div>
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3" data-testid="messages-thread">
                  {msgs.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-8">No messages yet. Say hi!</div>
                  ) : msgs.map((m, i) => {
                    const mine = m.from_user_id === user?.user_id;
                    return (
                      <div key={m.id || i} data-testid={`msg-${i}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          mine ? "bg-[#10b981] text-[#022c22] rounded-br-md" : "bg-white/10 text-slate-100 rounded-bl-md"
                        }`}>
                          {m.body}
                          <div className={`text-[9px] mt-1 opacity-70 font-mono-tech`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 border-t border-white/10 flex gap-2">
                  <Input
                    data-testid="message-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type a message…"
                    className="bg-white/5 border-white/10 text-slate-100"
                  />
                  <Button
                    data-testid="message-send-btn"
                    onClick={send}
                    className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
                  >
                    <Send className="w-4 h-4" strokeWidth={1.75} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
