import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  HeartPulse,
  MapPin,
  Navigation,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import "./_group.css";

export function VisitTicketDestination() {
  const [resetting, setResetting] = useState(false);

  const resetKiosk = () => {
    setResetting(true);
    window.setTimeout(() => window.location.reload(), 450);
  };

  return (
    <main className="completion-ticket relative min-h-[100dvh] overflow-hidden">
      <style>{`
        .completion-ticket { isolation: isolate; }
        .completion-ticket::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: .22;
          background-image: radial-gradient(rgba(153,0,0,.13) .7px, transparent .7px);
          background-size: 18px 18px;
          mask-image: linear-gradient(135deg, black, transparent 74%);
        }
        .ticket-reveal { animation: ticket-reveal .6s cubic-bezier(.22,.8,.32,1) both; }
        .ticket-slide { animation: ticket-slide .7s cubic-bezier(.22,.8,.32,1) .08s both; }
        .ticket-destination { animation: ticket-destination .72s cubic-bezier(.22,.8,.32,1) .15s both; }
        @keyframes ticket-reveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticket-slide {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes ticket-destination {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticket-reveal, .ticket-slide, .ticket-destination { animation: none; }
        }
      `}</style>

      <header className="ticket-reveal relative z-10 flex items-center justify-between px-7 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--iu-crimson)] text-[var(--iu-paper)] shadow-[0_8px_20px_rgba(153,0,0,.16)]">
            <HeartPulse size={23} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-.035em] text-[var(--iu-crimson)]">
              IU Student Health Center
            </p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#8d756b]">
              Bloomington campus
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#c9ddcd] bg-[#e6f0e5] px-3.5 py-2 text-xs font-bold text-[var(--iu-success)]">
          <CheckCircle2 size={15} />
          Check-in complete
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1120px] gap-7 px-7 pb-8 pt-3 sm:px-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-12 lg:px-14 lg:pb-12 lg:pt-6">
        <section className="ticket-slide flex flex-col justify-center lg:min-h-[625px]">
          <p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[#8d756b]">
            Your arrival ticket
          </p>
          <h1
            className="max-w-[420px] text-[clamp(3.1rem,6.8vw,5.35rem)] font-semibold leading-[.93] tracking-[-.075em] text-[var(--iu-crimson)]"
            style={{ fontFamily: "var(--font-display, 'Fraunces'), Georgia, serif" }}
          >
            You&apos;re all set.
          </h1>
          <p className="mt-6 max-w-[395px] text-[17px] leading-7 text-[var(--iu-muted)]">
            Your check-in is complete. Keep this visit ticket in mind as you head to your care team.
          </p>
          <div className="mt-8 flex items-start gap-2.5 text-xs font-medium leading-5 text-[#9a8478]">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--iu-success)]" />
            <span>Your information is protected and will clear when you tap Done.</span>
          </div>
        </section>

        <section className="ticket-destination relative overflow-hidden rounded-[30px] border border-[var(--iu-border)] bg-[var(--iu-paper)] shadow-[0_25px_65px_rgba(108,35,35,.13)]">
          <div className="absolute right-0 top-0 h-36 w-36 overflow-hidden rounded-tr-[30px]" aria-hidden="true">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border-[18px] border-[#f4e6d5]" />
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border-[12px] border-[#f2d9bd]" />
          </div>

          <div className="relative border-b border-dashed border-[#d8c7b5] px-7 pb-6 pt-7 sm:px-9 sm:pt-9">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[.19em] text-[#9a8074]">Appointment</p>
              <span className="flex items-center gap-1.5 rounded-full bg-[#f4e6d5] px-3 py-1.5 text-xs font-bold text-[#7f4d4d]">
                <Check size={13} strokeWidth={3} /> Confirmed
              </span>
            </div>
            <p className="mt-5 text-2xl font-bold tracking-[-.03em] text-[#632f2f]">Primary care visit</p>
            <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold text-[var(--iu-muted)]">
              <span className="flex items-center gap-2"><Clock3 size={17} className="text-[var(--iu-crimson)]" />10:30 AM</span>
              <span className="flex items-center gap-2"><HeartPulse size={17} className="text-[var(--iu-crimson)]" />Maya Patel, MD</span>
            </div>
          </div>

          <div className="relative bg-[#fff6e8] px-7 py-7 sm:px-9 sm:py-9">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[var(--iu-success)]">
              <Navigation size={17} fill="currentColor" />
              Next stop
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[.18em] text-[#806259]">Go to</p>
            <h2
              className="mt-1 text-[clamp(3.35rem,7.5vw,6rem)] font-semibold leading-[.9] tracking-[-.08em] text-[var(--iu-crimson)]"
              style={{ fontFamily: "var(--font-display, 'Fraunces'), Georgia, serif" }}
            >
              First floor
            </h2>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#ead4bd] bg-[#fffaf1]/75 p-4 text-[#632f2f]">
              <MapPin size={22} className="mt-0.5 shrink-0 text-[var(--iu-crimson)]" />
              <div>
                <p className="text-base font-bold">First floor waiting area</p>
                <p className="mt-1 text-sm leading-5 text-[var(--iu-muted)]">Take a seat there. Your care team will call you shortly.</p>
              </div>
            </div>
            <div className="mt-7 flex items-center gap-3 border-t border-[#eadccb] pt-6">
              <button
                type="button"
                onClick={resetKiosk}
                disabled={resetting}
                className="flex min-h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[var(--iu-crimson)] px-5 text-[15px] font-bold text-[var(--iu-paper)] shadow-[0_10px_22px_rgba(122,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-[var(--iu-crimson-dark)] focus:outline-none focus:ring-4 focus:ring-[var(--iu-crimson)]/20 disabled:cursor-wait disabled:opacity-80"
              >
                {resetting ? <><RotateCcw size={18} className="animate-spin" /> Clearing kiosk</> : <>Done <ArrowRight size={18} /></>}
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] font-semibold text-[#9a8074]">Demo / sample data</p>
          </div>
        </section>
      </div>
    </main>
  );
}