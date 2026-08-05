import { useEffect, useMemo, useState } from "react";
import { studentApi } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Search, MessageSquarePlus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InstructorRoster({ searchQuery = "" }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const [newStudent, setNewStudent] = useState({
    student_name: "",
    email: "",
    license_track: "Code 8",
    total_lessons: 20,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await studentApi.list();
      setStudents(res.data);
    } catch (e) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = (searchQuery || q).toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      s.student_name.toLowerCase().includes(term) || s.license_track.toLowerCase().includes(term)
    );
  }, [students, q, searchQuery]);

  const openFeedback = (student) => {
    setActiveStudent(student);
    setRating(5);
    setComment("");
    setFeedbackOpen(true);
  };

  const submitFeedback = async () => {
    if (!activeStudent) return;
    if (!comment.trim()) return toast.error("Please write feedback");
    setSaving(true);
    try {
      await studentApi.addFeedback({ student_id: activeStudent.id, rating, comment });
      toast.success("Feedback saved");
      setFeedbackOpen(false);
      await load();
    } catch (e) {
      toast.error("Failed to save feedback");
    } finally {
      setSaving(false);
    }
  };

  const createStudent = async () => {
    if (!newStudent.student_name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      await studentApi.create(newStudent);
      toast.success("Student added");
      setAddOpen(false);
      setNewStudent({ student_name: "", email: "", license_track: "Code 8", total_lessons: 20 });
      await load();
    } catch (e) {
      toast.error("Failed to add student");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section data-testid="instructor-roster" className="reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">
            Section 01
          </div>
          <h2 className="text-3xl font-heading font-bold">Instructor Roster</h2>
          <p className="text-slate-400 text-sm mt-1">All students on Code 8 and Code 10 tracks.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <Input
              data-testid="roster-search-input"
              placeholder="Search students…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 h-10 text-slate-100"
            />
          </div>
          <Button
            data-testid="roster-add-student-btn"
            onClick={() => setAddOpen(true)}
            className="h-10 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" strokeWidth={2} /> Add Student
          </Button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" data-testid="roster-table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Track</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Progress</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Rating</th>
                <th className="px-6 py-4 font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 text-[#10b981] animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No students found.</td></tr>
              ) : filtered.map((s, idx) => (
                <tr
                  key={s.id}
                  data-testid={`roster-row-${idx}`}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1D6A4A] flex items-center justify-center font-heading font-semibold text-sm">
                        {s.student_name.split(" ").map((n) => n[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <div className="font-heading font-semibold text-slate-100">{s.student_name}</div>
                        <div className="text-xs text-slate-400">{s.lessons_completed}/{s.total_lessons} lessons</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="neon-badge" data-testid={`roster-track-${idx}`}>{s.license_track}</span>
                  </td>
                  <td className="px-6 py-5 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <Progress
                        value={s.progress}
                        className="h-2 bg-slate-800 flex-1 [&>*]:bg-[#1D6A4A]"
                      />
                      <span className="font-mono-tech text-xs text-[#10b981] w-10 text-right">{s.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-[#10b981] text-[#10b981]" strokeWidth={1.5} />
                      <span className="font-heading font-semibold text-slate-100">{s.rating.toFixed(1)}</span>
                      <span className="text-xs text-slate-400">/5.0</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button
                      data-testid={`roster-feedback-btn-${idx}`}
                      variant="ghost"
                      onClick={() => openFeedback(s)}
                      className="h-9 rounded-full text-[#10b981] hover:text-[#022c22] hover:bg-[#10b981]"
                    >
                      <MessageSquarePlus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                      Feedback
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent data-testid="feedback-modal" className="bg-slate-900 border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="font-heading">Feedback for {activeStudent?.student_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Share progress notes visible to the student and faculty.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    data-testid={`feedback-star-${n}`}
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-7 h-7 ${n <= rating ? "fill-[#10b981] text-[#10b981]" : "text-slate-600"}`} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="fb-comment" className="text-slate-300">Comment</Label>
              <Textarea
                id="fb-comment"
                data-testid="feedback-comment-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Great parallel parking today — focus on hill starts next session."
                className="bg-white/5 border-white/10 text-slate-100 mt-2 min-h-[110px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="feedback-cancel-btn"
              variant="ghost"
              onClick={() => setFeedbackOpen(false)}
              className="text-slate-300 hover:bg-white/5"
            >Cancel</Button>
            <Button
              data-testid="feedback-submit-btn"
              onClick={submitFeedback}
              disabled={saving}
              className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
            >{saving ? "Saving…" : "Save Feedback"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add student modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-testid="add-student-modal" className="bg-slate-900 border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="font-heading">Add New Student</DialogTitle>
            <DialogDescription className="text-slate-400">Enroll a student on Code 8 or Code 10.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Full Name</Label>
              <Input
                data-testid="new-student-name"
                value={newStudent.student_name}
                onChange={(e) => setNewStudent({ ...newStudent, student_name: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email</Label>
              <Input
                data-testid="new-student-email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="bg-white/5 border-white/10 text-slate-100 mt-2"
              />
            </div>
            <div>
              <Label className="text-slate-300">Track</Label>
              <Select value={newStudent.license_track} onValueChange={(v) => setNewStudent({ ...newStudent, license_track: v })}>
                <SelectTrigger data-testid="new-student-track" className="bg-white/5 border-white/10 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                  <SelectItem value="Code 8">Code 8</SelectItem>
                  <SelectItem value="Code 10">Code 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="text-slate-300 hover:bg-white/5">Cancel</Button>
            <Button
              data-testid="new-student-submit"
              onClick={createStudent}
              disabled={saving}
              className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold"
            >{saving ? "Adding…" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
