import { useRef, useState, type KeyboardEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheckBig,
  Clock3,
  Globe2,
  HeartPulse,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  MessageCircleMore,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

type CheckInMode = "phone" | "appointment";
type Screen = "welcome" | "code" | "complete";

const languages = [
  { label: "English", short: "EN" },
  { label: "Español", short: "ES" },
  { label: "中文", short: "中" },
];

export function KioskCheckIn() {
  const [mode, setMode] = useState<CheckInMode>("phone");
  const [screen, setScreen] = useState<Screen>("welcome");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [language, setLanguage] = useState(languages[0]);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isComplete = screen === "complete";
  const canContinue =
    mode === "phone"
      ? value.replace(/\D/g, "").length >= 10
      : value.trim().length >= 5;
  const canVerify = otp.every((digit) => digit.length === 1);

  const handleContinue = () => {
    if (!canContinue) {
      setError(
        mode === "phone"
          ? "Please enter a 10-digit mobile number."
          : "Please enter your appointment code.",
      );
      return;
    }
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setScreen("code");
    }, 650);
  };

  const handleOtpChange = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < otp.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = () => {
    if (!canVerify) {
      setError("Enter the 6-digit code to continue.");
      return;
    }
    setError("");
    setScreen("complete");
  };

  const startOver = () => {
    setScreen("welcome");
    setValue("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  return (
    <main
      className="kiosk-shell relative min-h-[100dvh] overflow-hidden text-[#173f42]"
      style={{
        background:
          "radial-gradient(circle at 8% 0%, rgba(248,226,228,.95), transparent 30%), #f7f6f0",
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <style>{`
        .kiosk-shell { isolation: isolate; }
        .kiosk-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .22;
          background-image: radial-gradient(rgba(23,63,66,.15) .7px, transparent .7px);
          background-size: 18px 18px;
          mask-image: linear-gradient(135deg, black, transparent 66%);
          z-index: -1;
        }
        .kiosk-display { animation: kiosk-reveal .6s cubic-bezier(.22,.8,.32,1) both; }
        .kiosk-card { animation: kiosk-card .7s cubic-bezier(.22,.8,.32,1) .08s both; }
        .kiosk-fade { animation: kiosk-fade .32s ease both; }
        .kiosk-shimmer { animation: kiosk-shimmer 1.2s ease-in-out infinite; }
        @keyframes kiosk-reveal { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes kiosk-card { from { opacity: 0; transform: translateY(18px) scale(.985) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes kiosk-fade { from { opacity: 0; transform: translateX(10px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes kiosk-shimmer { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .kiosk-display, .kiosk-card, .kiosk-fade { animation: none; }
        }
      `}</style>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#174f50] text-[#f7f6f0] shadow-[0_8px_20px_rgba(23,79,80,.16)]">
            <HeartPulse size={23} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-.03em] text-[#174f50]">
              IU Student Health Center
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#718789]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4865d]" />
              Campus health, made simple
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              aria-expanded={languageOpen}
              onClick={() => setLanguageOpen((open) => !open)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-[#d6e1da] bg-[#fbfcf8]/80 px-4 text-sm font-semibold text-[#315d5b] transition hover:border-[#9fbbb0] hover:bg-[#eff6f0] focus:outline-none focus:ring-2 focus:ring-[#d4865d]/50"
            >
              <Globe2 size={16} />
              <span>{language.short}</span>
              <ChevronDown size={15} className={languageOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-14 z-30 w-40 rounded-2xl border border-[#d6e1da] bg-[#fbfcf8] p-1.5 shadow-[0_16px_34px_rgba(31,70,65,.16)]">
                {languages.map((item) => (
                  <button
                    key={item.short}
                    type="button"
                    onClick={() => {
                      setLanguage(item);
                      setLanguageOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-[#315d5b] hover:bg-[#e8f1eb]"
                  >
                    {item.label}
                    {item.short === language.short && <Check size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowHelp((open) => !open)}
            className="flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-[#496c6a] transition hover:bg-[#e6f0e9] focus:outline-none focus:ring-2 focus:ring-[#d4865d]/50"
          >
            <HelpCircle size={17} />
            <span className="hidden sm:inline">Need help?</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-7 px-6 pb-8 pt-2 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(470px,548px)] lg:gap-12 lg:px-14 lg:pb-14 lg:pt-6">
        <section className="kiosk-display flex flex-col justify-center lg:min-h-[650px]">
          <div className="max-w-[520px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9ddd1] bg-[#e8f1eb] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#3e706a]">
              <Sparkles size={14} className="text-[#d4865d]" />
              Your campus health visit
            </div>
            <h1
              className="max-w-[510px] text-[clamp(2.75rem,5vw,5.15rem)] font-semibold leading-[.98] tracking-[-.065em] text-[#174f50]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Welcome, Hoosier. We&apos;re glad you&apos;re here.
            </h1>
            <p className="mt-6 max-w-[420px] text-[17px] leading-7 text-[#5e7777]">
              Check in for your appointment in a few quick steps. Your health information stays private and secure.
            </p>

            <div className="mt-10 grid max-w-[500px] grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-[#d8e5db] bg-[#fbfcf8]/70 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f5dfbe] text-[#9b6149]">
                  <Clock3 size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#315d5b]">Takes about 2 minutes</p>
                  <p className="mt-1 text-xs leading-5 text-[#77908c]">No paperwork to carry.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[#d8e5db] bg-[#fbfcf8]/70 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#dcebe4] text-[#3d7770]">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#315d5b]">Private by design</p>
                  <p className="mt-1 text-xs leading-5 text-[#77908c]">Your session clears when done.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 flex items-center gap-2 text-xs font-medium text-[#829a95]">
            <LockKeyhole size={14} />
            <span>For your privacy, please use this screen alone.</span>
          </div>
        </section>

        <section className="kiosk-card relative flex min-h-[560px] flex-col justify-center rounded-[30px] border border-[#dbe7de] bg-[#fbfcf8] p-6 shadow-[0_24px_60px_rgba(41,82,73,.12)] sm:p-9 lg:min-h-[610px] lg:p-11">
          <div className="absolute right-0 top-0 h-32 w-32 overflow-hidden rounded-tr-[30px]">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full border-[18px] border-[#e8f1eb]" />
            <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full border-[12px] border-[#f4ddbb]" />
          </div>

          {isComplete ? (
            <div className="kiosk-fade flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-[27px] bg-[#dcebe4] text-[#34766d]">
                <CircleCheckBig size={42} strokeWidth={1.7} />
              </div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#6f9188]">You&apos;re checked in</p>
              <h2 className="max-w-[380px] text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.04] tracking-[-.055em] text-[#174f50]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Your visit is ready.
              </h2>
              <p className="mt-5 max-w-[350px] text-[16px] leading-7 text-[#63807c]">
                Please take a seat in the waiting area. A Student Health Center team member will be with you shortly.
              </p>
              <div className="mt-8 w-full max-w-[350px] rounded-2xl border border-[#e0e8df] bg-[#f3f7f1] p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4ddbb] text-[#9b6149]"><CalendarDays size={17} /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-[#77908c]">Today&apos;s visit</p>
                    <p className="mt-0.5 text-sm font-bold text-[#315d5b]">IU Student Health Center</p>
                  </div>
                </div>
              </div>
              <button type="button" onClick={startOver} className="mt-8 flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-bold text-[#46736d] hover:bg-[#e8f1eb] focus:outline-none focus:ring-2 focus:ring-[#d4865d]/50">
                Start another check-in <ArrowRight size={16} />
              </button>
            </div>
          ) : screen === "code" ? (
            <div className="kiosk-fade">
              <button type="button" onClick={() => { setScreen("welcome"); setError(""); }} className="mb-8 flex min-h-10 items-center gap-2 text-sm font-bold text-[#64827d] hover:text-[#174f50] focus:outline-none focus:ring-2 focus:ring-[#d4865d]/50">
                <ArrowLeft size={17} /> Back
              </button>
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5dfbe] text-[#9b6149]">
                <KeyRound size={26} strokeWidth={1.8} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#77908c]">One more step</p>
              <h2 className="mt-3 text-[clamp(2rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-.05em] text-[#174f50]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Enter your secure code
              </h2>
              <p className="mt-4 max-w-[390px] text-[15px] leading-6 text-[#63807c]">
                We sent a 6-digit code to the mobile number on file. This sample screen does not connect to live patient data.
              </p>
              <div className="mt-8 flex gap-2.5 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { otpRefs.current[index] = element; }}
                    inputMode="numeric"
                    aria-label={`Security code digit ${index + 1}`}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    className="h-14 min-w-0 flex-1 rounded-xl border border-[#cadbd1] bg-[#f6f8f3] text-center text-xl font-bold text-[#174f50] outline-none transition focus:border-[#d4865d] focus:bg-[#fffaf2] focus:ring-2 focus:ring-[#d4865d]/20"
                  />
                ))}
              </div>
              {error && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#b35f51]"><AlertCircle size={16} />{error}</p>}
              <button type="button" onClick={verifyCode} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#174f50] px-5 text-[15px] font-bold text-[#f7f6f0] shadow-[0_9px_18px_rgba(23,79,80,.18)] transition hover:-translate-y-0.5 hover:bg-[#226361] focus:outline-none focus:ring-4 focus:ring-[#d4865d]/25">
                Verify and continue <ArrowRight size={18} />
              </button>
              <button type="button" onClick={() => setError("A new code would be sent here in the connected kiosk.")} className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 text-sm font-bold text-[#527773] hover:text-[#174f50]">
                <MessageCircleMore size={16} /> Didn&apos;t receive a code?
              </button>
            </div>
          ) : (
            <div className="kiosk-fade">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#77908c]">Start your check-in</p>
                <h2 className="mt-3 text-[clamp(2rem,3.5vw,2.8rem)] font-semibold leading-[1.05] tracking-[-.05em] text-[#174f50]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  How would you like to begin?
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#edf3ed] p-1.5" role="tablist" aria-label="Check-in method">
                <button type="button" role="tab" aria-selected={mode === "phone"} onClick={() => { setMode("phone"); setValue(""); setError(""); }} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#d4865d]/50 ${mode === "phone" ? "bg-[#fbfcf8] text-[#174f50] shadow-[0_3px_10px_rgba(38,75,66,.08)]" : "text-[#73908a] hover:text-[#315d5b]"}`}>
                  <Phone size={17} /> Phone number
                </button>
                <button type="button" role="tab" aria-selected={mode === "appointment"} onClick={() => { setMode("appointment"); setValue(""); setError(""); }} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#d4865d]/50 ${mode === "appointment" ? "bg-[#fbfcf8] text-[#174f50] shadow-[0_3px_10px_rgba(38,75,66,.08)]" : "text-[#73908a] hover:text-[#315d5b]"}`}>
                  <CalendarDays size={17} /> Appointment code
                </button>
              </div>

              <div className="mt-7">
                <label htmlFor="checkin-value" className="mb-2.5 block text-sm font-bold text-[#315d5b]">
                  {mode === "phone" ? "Phone number" : "Appointment code"}
                </label>
                <div className="relative">
                  {mode === "phone" ? <Phone size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78938d]" /> : <CalendarDays size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#78938d]" />}
                  <input
                    id="checkin-value"
                    type={mode === "phone" ? "tel" : "text"}
                    inputMode={mode === "phone" ? "tel" : "text"}
                    autoComplete="off"
                    value={value}
                    onChange={(event) => { setValue(event.target.value); setError(""); }}
                    placeholder={mode === "phone" ? "(812) 555-0147" : "e.g. IU-48291"}
                    className="min-h-14 w-full rounded-2xl border border-[#cadbd1] bg-[#f6f8f3] pl-12 pr-4 text-[16px] font-semibold tracking-[.01em] text-[#174f50] outline-none transition placeholder:text-[#a2b2aa] focus:border-[#d4865d] focus:bg-[#fffaf2] focus:ring-4 focus:ring-[#d4865d]/15"
                    aria-describedby="privacy-note"
                  />
                </div>
                {mode === "appointment" && (
                  <button type="button" onClick={() => { setValue("IU-48291"); setError(""); }} className="mt-2 flex min-h-9 items-center gap-1.5 text-xs font-bold text-[#64827d] hover:text-[#174f50]">
                    <Sparkles size={13} /> Use sample code IU-48291
                  </button>
                )}
                {error && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#b35f51]"><AlertCircle size={16} />{error}</p>}
              </div>

              <button type="button" disabled={loading} onClick={handleContinue} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#174f50] px-5 text-[15px] font-bold text-[#f7f6f0] shadow-[0_9px_18px_rgba(23,79,80,.18)] transition hover:-translate-y-0.5 hover:bg-[#226361] focus:outline-none focus:ring-4 focus:ring-[#d4865d]/25 disabled:cursor-wait disabled:opacity-90">
                {loading ? (
                  <>
                    <span className="kiosk-shimmer flex items-center gap-1.5" aria-hidden="true"><span className="h-1.5 w-1.5 rounded-full bg-[#f7f6f0]" /><span className="h-1.5 w-1.5 rounded-full bg-[#f7f6f0]" /><span className="h-1.5 w-1.5 rounded-full bg-[#f7f6f0]" /></span>
                    Preparing your secure check-in
                  </>
                ) : <>Continue securely <ArrowRight size={18} /></>}
              </button>

              <p id="privacy-note" className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#829a95]">
                <LockKeyhole size={14} className="mt-0.5 shrink-0" />
                We&apos;ll only use this to find your visit and verify your identity. Nothing is saved on this screen.
              </p>
            </div>
          )}
        </section>
      </div>

      {showHelp && (
        <div className="fixed bottom-5 right-5 z-40 w-[min(350px,calc(100vw-40px))] rounded-2xl border border-[#d6e4da] bg-[#fbfcf8] p-5 shadow-[0_18px_42px_rgba(31,70,65,.2)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#174f50]">Need a hand?</p>
              <p className="mt-1.5 text-sm leading-5 text-[#6b8580]">Ask a Student Health Center team member if you need assistance or do not have your phone.</p>
            </div>
            <button type="button" aria-label="Close help" onClick={() => setShowHelp(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6d8983] hover:bg-[#e8f1eb]"><span className="text-xl leading-none">×</span></button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f2f6f0] px-3 py-2.5 text-xs font-bold text-[#527773]"><Stethoscope size={15} /> Student Health Center assistance is available.</div>
        </div>
      )}
    </main>
  );
}