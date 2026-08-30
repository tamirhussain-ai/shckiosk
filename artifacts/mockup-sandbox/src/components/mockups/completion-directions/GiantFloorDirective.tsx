import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  HeartPulse,
  LockKeyhole,
  MapPin,
  RotateCcw,
} from "lucide-react";
import "./_group.css";

export function GiantFloorDirective() {
  const [isReset, setIsReset] = useState(false);

  if (isReset) {
    return (
      <main className="min-h-[100dvh] bg-[var(--iu-cream)] px-6 py-6 text-[var(--iu-ink)] sm:px-10 lg:px-14">
        <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-[1120px] flex-col">
          <header className="flex items-center gap-3 border-b border-[var(--iu-border)] pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--iu-crimson)] text-[var(--iu-paper)]">
              <HeartPulse size={23} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[17px] font-bold tracking-[-.035em] text-[var(--iu-crimson)]">
                IU Student Health Center
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--iu-muted)]">
                Bloomington campus
              </p>
            </div>
          </header>
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f1e1d3] text-[var(--iu-crimson)]">
              <RotateCcw size={34} />
            </div>
            <h1 className="completion-serif mt-8 text-5xl font-semibold tracking-[-.06em] text-[var(--iu-crimson)] sm:text-6xl">
              Ready for the next student.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--iu-muted)]">
              This check-in has been cleared from the screen.
            </p>
            <button
              type="button"
              onClick={() => setIsReset(false)}
              className="mt-9 flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[var(--iu-crimson)] px-7 text-base font-bold text-[var(--iu-paper)] shadow-[0_10px_22px_rgba(122,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-[var(--iu-crimson-dark)] focus:outline-none focus:ring-4 focus:ring-[var(--iu-crimson)]/20"
            >
              Return to completion
              <ArrowRight size={18} />
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--iu-cream)] px-6 py-6 text-[var(--iu-ink)] sm:px-10 lg:px-14">
      <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border-[36px] border-[#f1dfcf] opacity-80" />
      <div className="pointer-events-none absolute -bottom-36 -left-24 h-80 w-80 rounded-full border-[28px] border-[#f3e7d6] opacity-90" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] max-w-[1120px] flex-col">
        <header className="flex items-center justify-between border-b border-[var(--iu-border)] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--iu-crimson)] text-[var(--iu-paper)] shadow-[0_8px_20px_rgba(153,0,0,.16)]">
              <HeartPulse size={23} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[17px] font-bold tracking-[-.035em] text-[var(--iu-crimson)]">
                IU Student Health Center
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--iu-muted)]">
                Bloomington campus
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-[var(--iu-muted)] sm:flex">
            <LockKeyhole size={14} />
            Private check-in
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 items-center gap-8 py-8 lg:grid-cols-[1.42fr_.58fr] lg:gap-16 lg:py-10">
          <section aria-labelledby="destination-heading">
            <div className="flex w-fit items-center gap-2 rounded-full border border-[#c9ddcd] bg-[#e6f0e5] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[var(--iu-success)]">
              <CheckCircle2 size={15} />
              Check-in complete
            </div>
            <p className="mt-8 text-sm font-bold uppercase tracking-[.2em] text-[var(--iu-muted)]">
              Please go to
            </p>
            <h1
              id="destination-heading"
              className="completion-serif mt-2 max-w-[720px] text-[clamp(4.5rem,12vw,9.5rem)] font-semibold leading-[.82] tracking-[-.095em] text-[var(--iu-crimson)]"
            >
              FIRST
              <span className="block text-[#bd5b48]">FLOOR</span>
            </h1>
            <div className="mt-7 flex items-center gap-4 border-l-[5px] border-[var(--iu-crimson)] pl-5 sm:pl-6">
              <MapPin className="h-8 w-8 shrink-0 text-[var(--iu-crimson)]" strokeWidth={2.2} />
              <p className="text-[clamp(1.8rem,3.3vw,3rem)] font-bold leading-none tracking-[-.055em] text-[var(--iu-ink)]">
                Waiting area
              </p>
            </div>
            <p className="mt-7 max-w-[560px] text-base leading-7 text-[var(--iu-muted)] sm:text-[17px]">
              <span className="font-bold text-[var(--iu-ink)]">Your care team is expecting you.</span>{" "}
              This kiosk is on the second floor. Proceed to the first floor and Primary Care waiting area.
            </p>
          </section>

          <aside className="rounded-[26px] border border-[var(--iu-border)] bg-[var(--iu-paper)] p-6 shadow-[0_20px_50px_rgba(108,35,35,.1)] sm:p-7">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--iu-muted)]">
              <Check size={16} className="text-[var(--iu-success)]" />
              Visit confirmed
            </div>
            <dl className="mt-6 divide-y divide-[var(--iu-border)]">
              <div className="py-4 first:pt-0">
                <dt className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--iu-muted)]">Provider</dt>
                <dd className="mt-1 text-base font-bold text-[var(--iu-ink)]">Maya Patel, MD</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--iu-muted)]">Visit</dt>
                <dd className="mt-1 text-base font-bold text-[var(--iu-ink)]">Primary care visit</dd>
              </div>
              <div className="py-4 last:pb-0">
                <dt className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--iu-muted)]">Time</dt>
                <dd className="mt-1 text-base font-bold text-[var(--iu-ink)]">10:30 AM</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setIsReset(true)}
              className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--iu-crimson)] px-5 text-base font-bold text-[var(--iu-paper)] shadow-[0_10px_22px_rgba(122,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-[var(--iu-crimson-dark)] focus:outline-none focus:ring-4 focus:ring-[var(--iu-crimson)]/20"
            >
              Done
              <ArrowRight size={18} />
            </button>
            <p className="mt-4 text-center text-[11px] leading-5 text-[var(--iu-muted)]">
              Demo / sample data only. No patient information is displayed.
            </p>
          </aside>
        </div>
        <footer className="border-t border-[var(--iu-border)] pt-4 text-center text-xs font-medium text-[var(--iu-muted)]">
          Kiosk location: Second floor · For your privacy, this screen will clear when you tap Done.
        </footer>
      </div>
    </main>
  );
}