import { useState } from "react";
import { GraduationCap, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "1. Show the Instructor Roster",
    body: "Click 'Instructor Roster' in the sidebar. Point out the searchable table, Code 8 vs Code 10 badges, the live progress bars, and click 'Feedback' on any student to open the rating modal — it's the moment your lecturer sees UX polish.",
  },
  {
    title: "2. Show the Calendar Scheduler",
    body: "Open 'Calendar Slots' → toggle between List and Week views. In Week view, click an empty cell to open the pre-filled Add Slot modal. Then hit 'Run 24h Reminders' to demonstrate the automated email job.",
  },
  {
    title: "3. Show the Fleet Manager",
    body: "Point out the amber 'Service Due' card (Fleet-03 at 108/100 hrs). Click 'Mark Serviced' to reset the counter — visible business logic that impresses.",
  },
  {
    title: "4. Show Payments (ZAR)",
    body: "Open 'Payments'. Highlight the 4 packages (R500 → R7 500), click 'Buy Package' on Pro Pack — it opens a real Stripe test checkout. Use card 4242 4242 4242 4242, any future expiry, any CVC.",
  },
  {
    title: "5. Show the Student view",
    body: "Sign out and sign back in with a different Google account (or ask a classmate to). That account will land as a Student and see: Book Lesson, My Lessons, Payments, Messages. Book a slot — the instructor gets it in real time.",
  },
  {
    title: "6. Show the Admin power tools",
    body: "As admin (you), open 'User Manager' to promote/demote users, then 'Analytics' for revenue, bookings and fleet at a glance. Use the 'Reset Demo Data' button between demos to start clean.",
  },
];

export default function PresenterGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  return (
    <>
      <button
        data-testid="presenter-guide-btn"
        onClick={() => { setOpen(true); setStep(0); }}
        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:border-[#10b981]/40 transition-colors text-slate-300 hover:text-[#10b981] text-xs font-heading font-semibold"
      >
        <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
        Presenter Guide
      </button>

      {open && (
        <div
          data-testid="presenter-guide-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card-solid p-8 max-w-lg w-full border border-[#10b981]/40 neon-glow relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              data-testid="presenter-guide-close"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#10b981] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#022c22]" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-mono-tech text-[10px] text-[#10b981] uppercase tracking-widest">Lecture Demo</div>
                <div className="font-heading font-bold text-xl">Presenter Guide</div>
              </div>
            </div>

            <div className="font-heading font-semibold text-lg text-slate-100 mb-2">
              {STEPS[step].title}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {STEPS[step].body}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`w-6 h-1 rounded-full ${i === step ? "bg-[#10b981]" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="text-slate-300 hover:bg-white/5 h-9 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button
                    data-testid="presenter-guide-next"
                    onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                    className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold h-9 px-4"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.75} />
                  </Button>
                ) : (
                  <Button
                    data-testid="presenter-guide-finish"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-[#10b981] hover:bg-[#0ea672] text-[#022c22] font-heading font-semibold h-9 px-4"
                  >
                    Ready to present
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
