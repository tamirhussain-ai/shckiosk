import { CheckCircle2, Globe2, HelpCircle, MapPin, ChevronDown, ArrowRight } from 'lucide-react';
import './_group.css';

type Motion = 'glow' | 'pulse' | 'destination';

export function CompletionPreview({ motion }: { motion: Motion }) {
  const floorClass =
    motion === 'glow'
      ? 'completion-motion-glow'
      : motion === 'pulse'
        ? 'completion-motion-pulse'
        : '';

  return (
    <main className="completion-motion-root relative min-h-screen overflow-hidden">
      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#990000] text-[#fff9ed] shadow-[0_8px_20px_rgba(153,0,0,.16)]">
            <img
              src="/iu-trident-reverse-cropped.png"
              alt="Indiana University trident"
              className="h-9 w-9 object-contain"
            />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-.035em] text-[#990000]">IU Student Health Center</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#9a5147]">Demo mode · sample data only</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex min-h-11 items-center gap-2 rounded-full border border-[#e2d2bf] bg-[#fffaf1]/80 px-3.5 text-sm font-semibold text-[#632f2f]">
            <Globe2 size={16} />
            <span>EN</span>
            <ChevronDown size={15} />
          </div>
          <div className="flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-[#806259]">
            <HelpCircle size={17} />
            <span className="hidden sm:inline">Need help?</span>
          </div>
        </div>
      </header>

      <div className="relative z-20 mx-auto w-full max-w-[1370px] px-6 sm:px-10 lg:px-14">
        <div className="rounded-2xl border border-[#e2d2bf] bg-[#fffaf1]/95 p-2.5 shadow-[0_12px_30px_rgba(108,35,35,.08)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0 px-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#9a8074]">Screen preview</div>
            <div className="h-6 w-px shrink-0 bg-[#e7d9c7]" />
            <div className="flex min-w-max items-center gap-1 text-xs font-bold text-[#806259]">
              <span className="rounded-xl px-3 py-2.5">Welcome</span>
              <span className="rounded-xl px-3 py-2.5">Appointment</span>
              <span className="rounded-xl px-3 py-2.5">Details</span>
              <span className="rounded-xl px-3 py-2.5">Coverage</span>
              <span className="rounded-xl px-3 py-2.5">Consent</span>
              <span className="rounded-xl px-3 py-2.5">Questions</span>
              <span className="rounded-xl px-3 py-2.5">Checking</span>
              <span className="rounded-xl bg-[#990000] px-3 py-2.5 text-[#fff9ed] shadow-[0_3px_10px_rgba(153,0,0,.14)]">Complete</span>
            </div>
          </div>
        </div>
        <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#9a8074]">Preview mode · sample data only · no check-in is submitted</p>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1370px] grid-cols-1 gap-8 px-6 pb-9 pt-8 sm:px-10 lg:grid-cols-[minmax(0,.82fr)_minmax(540px,1.18fr)] lg:items-center lg:gap-16 lg:px-14 lg:pb-14 lg:pt-8">
        <section className="relative z-10 flex min-w-0 flex-col justify-center lg:min-h-[590px]">
          <div className="max-w-[560px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9ddcd] bg-[#e6f0e5] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#316148]">
              <CheckCircle2 size={14} />
              Check-in complete
            </div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[.16em] text-[#806960]">This kiosk is on the Second floor.</p>
            <p className="mb-7 max-w-[560px] text-[17px] font-bold leading-7 text-[#632f2f]">
              Head to the Waiting Area on the first floor. Your visit is ready for you.
            </p>
            <h1
              className={`max-w-[650px] text-[clamp(4.6rem,10vw,8.8rem)] font-semibold uppercase leading-[.82] tracking-[-.09em] text-[#990000] font-serif ${floorClass}`}
            >
              <span className="block">First</span>
              <span className="completion-motion-floor-accent block">floor</span>
            </h1>
            <div className={`completion-motion-waiting mt-7 flex items-center gap-4 border-l-[5px] border-[#990000] pl-5 ${motion === 'destination' ? 'completion-motion-destination' : ''}`}>
              <MapPin size={32} className={`completion-motion-pin shrink-0 text-[#990000] ${motion === 'destination' ? 'completion-motion-pin' : ''}`} />
              <p className="text-[clamp(1.8rem,3.3vw,3rem)] font-bold leading-none tracking-[-.05em] text-[#3d2626]">Waiting Area</p>
            </div>
          </div>
        </section>

        <section className="relative min-h-[580px] rounded-[30px] border border-[#e7d9c7] bg-[#fffaf1] p-6 shadow-[0_25px_65px_rgba(108,35,35,.12)] sm:p-9 lg:min-h-[610px] lg:p-11">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#806960]">
              <CheckCircle2 size={14} className="text-[#316148]" />
              Visit confirmed
            </div>
            <div className="mt-5 divide-y divide-[#e7d9c7]">
              <div className="pb-5">
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#9a8074]">Provider</p>
                <p className="mt-2 text-lg font-bold text-[#3d2626]">Dr. Alvarez</p>
              </div>
              <div className="py-5">
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#9a8074]">Visit</p>
                <p className="mt-2 text-lg font-bold text-[#3d2626]">Follow-up visit</p>
              </div>
              <div className="pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#9a8074]">Time</p>
                <p className="mt-2 text-lg font-bold text-[#3d2626]">10:30 AM</p>
              </div>
            </div>
            <button className="mt-auto flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#990000] px-5 text-[15px] font-bold text-[#fff9ed] shadow-[0_10px_22px_rgba(122,0,0,.18)]">
              Done
              <ArrowRight size={18} />
            </button>
            <p className="mt-4 text-center text-[10px] font-semibold text-[#9a8074]">Demo / sample data only. No patient information is displayed.</p>
          </div>
        </section>
      </div>

      <div className="completion-motion-watermark" aria-hidden="true">
        <img src="/iu-trident-crimson-cropped.png" alt="" />
      </div>
    </main>
  );
}