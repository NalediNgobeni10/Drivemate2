import { useEffect, useMemo, useState } from "react";
import { quizApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GraduationCap, CheckCircle2, XCircle, Trophy, Loader2, ChevronRight, RefreshCw, Award } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_STYLES = {
  Rules: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  Signs: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Controls: "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

export default function Quiz() {
  const [phase, setPhase] = useState("intro"); // intro | live | result
  const [code, setCode] = useState("both");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const r = await quizApi.myAttempts();
      setHistory(r.data);
    } catch {}
  };
  useEffect(() => { loadHistory(); }, []);

  const start = async () => {
    setLoading(true);
    try {
      const r = await quizApi.questions(count, code);
      setQuestions(r.data);
      setAnswers({});
      setIdx(0);
      setResult(null);
      setPhase("live");
    } catch { toast.error("Could not load questions"); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const r = await quizApi.submit({ code, answers });
      setResult(r.data);
      setPhase("result");
      loadHistory();
    } catch { toast.error("Submission failed"); }
    finally { setLoading(false); }
  };

  const q = questions[idx];
  const answered = answers[q?.id] !== undefined;
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;
  const bestPercent = history.length ? Math.max(...history.map((h) => h.percent)) : 0;

  // INTRO
  if (phase === "intro") {
    return (
      <section data-testid="quiz" className="reveal">
        <div className="mb-6">
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">K53 Practice</div>
          <h2 className="text-3xl font-heading font-bold flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-[#10b981]" strokeWidth={1.75} />
            Learner's Test Prep
          </h2>
          <p className="text-slate-400 text-sm mt-1">Sharpen your K53 knowledge between driving lessons. 75% and above is a pass.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="glass-card p-8">
            <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-3">New Attempt</div>
            <h3 className="font-heading font-bold text-2xl mb-6">Ready when you are.</h3>

            <div className="space-y-5 max-w-sm">
              <div>
                <label className="text-slate-300 text-sm">Licence code</label>
                <Select value={code} onValueChange={setCode}>
                  <SelectTrigger data-testid="quiz-code" className="bg-white/5 border-white/10 mt-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                    <SelectItem value="both">Both (Code 8 & 10)</SelectItem>
                    <SelectItem value="8">Code 8 only</SelectItem>
                    <SelectItem value="10">Code 10 only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-slate-300 text-sm">Number of questions</label>
                <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                  <SelectTrigger data-testid="quiz-count" className="bg-white/5 border-white/10 mt-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                    <SelectItem value="5">5 quick questions</SelectItem>
                    <SelectItem value="10">10 questions (recommended)</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="18">All 18 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="quiz-start-btn"
                onClick={start}
                disabled={loading}
                className="w-full h-12 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold text-base"
              >
                {loading ? "Loading…" : "Start practice"}
                <ChevronRight className="w-4 h-4 ml-1" strokeWidth={2} />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6" data-testid="quiz-best">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#10b981] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#022c22]" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest">Personal Best</div>
                  <div className="font-heading font-bold text-2xl text-[#10b981]">{bestPercent}%</div>
                </div>
              </div>
              <div className="text-slate-400 text-xs">Across {history.length} attempt{history.length === 1 ? "" : "s"}</div>
            </div>

            <div className="glass-card p-6">
              <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-widest mb-3">Recent Attempts</div>
              {history.length === 0 ? (
                <div className="text-sm text-slate-400">No attempts yet. Take your first quiz!</div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {history.slice(0, 6).map((h, i) => (
                    <div key={h.id} data-testid={`quiz-history-${i}`} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                      <div className="text-slate-300">{new Date(h.created_at).toLocaleDateString()}</div>
                      <div className={`font-mono-tech font-semibold ${h.passed ? "text-[#10b981]" : "text-amber-300"}`}>
                        {h.score}/{h.total} · {h.percent}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // LIVE quiz
  if (phase === "live" && q) {
    return (
      <section data-testid="quiz-live" className="reveal">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-1">Question {idx + 1} of {questions.length}</div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-mono-tech uppercase tracking-wider ${CATEGORY_STYLES[q.category]}`}>
                {q.category}
              </span>
              <span className="neon-badge">Code {q.code === "both" ? "8/10" : q.code}</span>
            </div>
          </div>
          <button
            data-testid="quiz-exit-btn"
            onClick={() => { setPhase("intro"); loadHistory(); }}
            className="text-slate-400 hover:text-slate-100 text-xs font-mono-tech uppercase tracking-widest"
          >Exit</button>
        </div>

        <Progress value={((idx + 1) / questions.length) * 100} className="h-1.5 bg-slate-800 [&>*]:bg-[#10b981] mb-8" />

        <div className="glass-card p-8 mb-6">
          <div className="font-heading font-semibold text-2xl text-slate-100 mb-6" data-testid="quiz-question">
            {q.question}
          </div>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button
                  key={i}
                  data-testid={`quiz-option-${i}`}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                    selected
                      ? "bg-[#10b981]/15 border-[#10b981]/50 text-slate-100"
                      : "bg-white/5 border-white/10 text-slate-300 hover:border-[#10b981]/30 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono-tech font-bold ${
                      selected ? "bg-[#10b981] text-[#022c22]" : "bg-white/10 text-slate-400"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="h-11 rounded-full text-slate-300 hover:bg-white/5"
          >
            Previous
          </Button>
          {idx < questions.length - 1 ? (
            <Button
              data-testid="quiz-next-btn"
              onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
              disabled={!answered}
              className="h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold px-6"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" strokeWidth={2} />
            </Button>
          ) : (
            <Button
              data-testid="quiz-submit-btn"
              onClick={submit}
              disabled={!allAnswered || loading}
              className="h-11 rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold px-6"
            >
              {loading ? "Submitting…" : "Submit answers"}
            </Button>
          )}
        </div>
      </section>
    );
  }

  // RESULT
  if (phase === "result" && result) {
    const passed = result.passed;
    return (
      <section data-testid="quiz-result" className="reveal">
        <div className={`glass-card p-10 text-center mb-8 ${passed ? "border-[#10b981]/50 neon-glow" : "border-amber-500/40"}`}>
          <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-5 ${passed ? "bg-[#10b981]" : "bg-amber-500/30"}`}>
            {passed ? <Award className="w-10 h-10 text-[#022c22]" strokeWidth={1.75} /> : <RefreshCw className="w-10 h-10 text-amber-200" strokeWidth={1.75} />}
          </div>
          <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest mb-2">
            {passed ? "You Passed" : "Keep going"}
          </div>
          <h2 className="font-heading text-5xl font-bold mb-2" data-testid="quiz-score">
            {result.score} <span className="text-slate-400 text-2xl">/ {result.total}</span>
          </h2>
          <div className={`text-2xl font-heading font-semibold ${passed ? "text-[#10b981]" : "text-amber-300"} mb-6`}>
            {result.percent}%
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              data-testid="quiz-retry-btn"
              onClick={() => setPhase("intro")}
              className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold h-11 px-6"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" strokeWidth={1.75} /> Try again
            </Button>
          </div>
        </div>

        <h3 className="font-heading font-semibold text-lg mb-3 text-slate-100">Review</h3>
        <div className="space-y-3">
          {result.breakdown.map((b, i) => (
            <div
              key={b.question_id}
              data-testid={`quiz-review-${i}`}
              className={`glass-card p-5 border-l-4 ${b.is_right ? "border-l-[#10b981]" : "border-l-red-400"}`}
            >
              <div className="flex items-start gap-3">
                {b.is_right
                  ? <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" strokeWidth={1.75} />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.75} />}
                <div className="flex-1">
                  <div className="font-heading font-semibold text-slate-100 mb-2">{b.question}</div>
                  <div className="space-y-1 text-sm">
                    <div className="text-slate-300">
                      Your answer: <span className={b.is_right ? "text-[#10b981]" : "text-red-300"}>{b.options[b.chosen]}</span>
                    </div>
                    {!b.is_right && (
                      <div className="text-slate-300">
                        Correct answer: <span className="text-[#10b981]">{b.options[b.correct]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>;
}
