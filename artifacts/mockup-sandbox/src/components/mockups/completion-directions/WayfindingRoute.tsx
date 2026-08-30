import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HeartPulse,
  MapPin,
  MoveDown,
  Navigation,
  RotateCcw,
} from "lucide-react";
import "./_group.css";

export function WayfindingRoute() {
  const [isReset, setIsReset] = useState(false);

  if (isReset) {
    return (
      <main className="min-h-[100dvh] bg-[var(--iu-cream)] px-6 py-8 text-[var(--iu-ink)] sm:px-10 lg:px-16">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#f1dfd4] text-[var(--iu-crimson)]">
            <HeartPulse size={30} strokeWidth={2.2} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--iu-muted)]">IU Student Health Center</p>
          <h1 className="completion-serif mt-4 text-5xl font-semibold tracking-[-0.06em] text-[var(--iu-crimson)] sm:text-6xl">
            Ready for the next student
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--iu-muted)]">
            This check-in is cleared. The kiosk is ready to begin again.
          </p>
          <button
            type="button"
            onClick={() => setIsReset(false)}
            className="mt-9 flex min-h-14 items-center gap-3 rounded-2xl bg-[var(--iu-crimson)] px-7 text-base font-bold text-[var(--iu-paper)] shadow-[0_12px_24px_rgba(122,0,0,.18)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#990000]/25"
          >
            <RotateCcw size={18} />
            Return to completion
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--iu-cream)] text-[var(--iu-ink)]">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border-[52px] border-[#f2dfcf] opacity-70" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full border-[68px] border-[#f5e9d9] opacity-80" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--iu-crimson)] text-[var(--iu-paper)] shadow-[0_8px_20px_rgba(153,0,0,.16)]">
            <HeartPulse size={23} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-.035em] text-[var(--iu-crimson)]">IU Student Health Center</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--iu-muted)]">Bloomington campus</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--iu-muted)] sm:flex">
          <CheckCircle2 size={17} className="text-[var(--iu-success)]" />
          Check-in complete
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-8 pt-3 sm:px-10 lg:px-16 lg:pb-14 lg:pt-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,.72fr)] lg:gap-12">
          <section className="completion-reveal">
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[var(--iu-success)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dceadf]"><Check size={15} strokeWidth={3} /></span>
              You&apos;re all set
            </div>
            <h1 className="completion-serif max-w-3xl text-[clamp(3.6rem,8vw,7.5rem)] font-semibold leading-[.88] tracking-[-.075em] text-[var(--iu-crimson)]">
              Head to your<br />
              <span className="text-[#bd5b48]">waiting area.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-7 text-[var(--iu-muted)] sm:text-xl">
              Your visit is ready. Follow the short route below and take a seat when you arrive.
            </p>

            <div className="mt-8 overflow-hidden rounded-[28px] border border-[var(--iu-border)] bg-[var(--iu-paper)] shadow-[0_22px_55px_rgba(108,35,35,.11)]">
              <div className="flex items-center justify-between border-b border-[#eadccb] px-5 py-4 sm:px-7">
                <div className="flex items-center gap-2 text-sm font-bold text-[#632f2f]">
                  <Navigation size={17} className="text-[var(--iu-crimson)]" />
                  Your route from this kiosk
                </div>
                <span className="rounded-full bg-[#f3e5d8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-[var(--iu-muted)]">About 1 minute</span>
              </div>
              <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                <div className="absolute bottom-8 left-[39px] top-8 w-0.5 bg-[#d9b9a6] sm:left-[51px]" />
                <div className="relative flex items-center gap-4 sm:gap-5">
                  <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-[var(--iu-paper)] bg-[var(--iu-crimson)] text-[var(--iu-paper)] shadow-sm sm:h-11 sm:w-11">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--iu-muted)]">You are here</p>
                    <p className="mt-0.5 text-lg font-bold text-[#632f2f]">Check-in kiosk</p>
                  </div>
                </div>
                <div className="relative my-3 ml-1 flex items-center gap-3 pl-9 text-sm font-semibold text-[#8d756b] sm:pl-12">
                  <MoveDown size={18} className="text-[#bd5b48]" />
                  Walk toward the elevators or stairs
                </div>
                <div className="relative flex items-center gap-4 sm:gap-5">
                  <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-[var(--iu-paper)] bg-[#f1dfd4] text-[var(--iu-crimson)] sm:h-11 sm:w-11">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--iu-muted)]">Change floors</p>
                    <p className="mt-0.5 text-lg font-bold text-[#632f2f]">Go to the first floor</p>
                  </div>
                </div>
                <div className="relative my-3 ml-1 flex items-center gap-3 pl-9 text-sm font-semibold text-[#8d756b] sm:pl-12">
                  <ArrowDown size={18} className="text-[#bd5b48]" />
                  Follow signs for Patient Waiting
                </div>
                <div className="relative flex items-center gap-4 sm:gap-5">
                  <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-[var(--iu-paper)] bg-[#dceadf] text-[var(--iu-success)] sm:h-11 sm:w-11">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--iu-success)]">Your destination</p>
                    <p className="mt-0.5 text-lg font-bold text-[#316148]">First floor waiting area</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="completion-card flex flex-col rounded-[28px] border border-[var(--iu-border)] bg-[var(--iu-paper)] p-6 shadow-[0_22px_55px_rgba(108,35,35,.1)] sm:p-8 lg:mt-20">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--iu-success)]">
              <CheckCircle2 size={20} />
              Visit confirmed
            </div>
            <div className="my-6 h-px bg-[#eadccb]" />
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--iu-muted)]">Provider</p>
                <p className="mt-1 text-xl font-bold text-[#632f2f]">Maya Patel, MD</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--iu-muted)]">Visit</p>
                <p className="mt-1 text-base font-bold text-[#632f2f]">Primary care visit</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 size={18} className="mt-0.5 text-[var(--iu-crimson)]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--iu-muted)]">Today</p>
                  <p className="mt-1 text-base font-bold text-[#632f2f]">10:30 AM</p>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-8">
              <button type="button" onClick={() => setIsReset(true)} className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-[var(--iu-crimson)] px-5 text-base font-bold text-[var(--iu-paper)] shadow-[0_12px_24px_rgba(122,0,0,.18)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--iu-crimson-dark)] focus:outline-none focus:ring-4 focus:ring-[#990000]/25">
                Done
                <ArrowRight size={19} />
              </button>
              <p className="mt-4 text-center text-[11px] leading-5 text-[var(--iu-muted)]">This screen clears after you tap Done.</p>
            </div>
          </aside>
        </div>
        <div className="mt-7 flex items-start gap-2 text-xs font-medium leading-5 text-[var(--iu-muted)]">
          <ChevronRight size={15} className="mt-0.5 shrink-0 text-[var(--iu-crimson)]" />
          Demo/sample data only. No patient identifiers are shown.
        </div>
      </div>
    </main>
  );
}