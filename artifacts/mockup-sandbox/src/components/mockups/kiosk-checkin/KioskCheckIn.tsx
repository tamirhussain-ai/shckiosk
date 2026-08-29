import { useRef, useState, type KeyboardEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
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
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";

type CheckInMode = "universityId" | "lastName" | "qr";
type Screen = "welcome" | "code" | "complete";

const languages = [
  { label: "English", short: "EN" },
  { label: "Español", short: "ES" },
  { label: "中文", short: "中" },
];

export function KioskCheckIn() {
  const [mode, setMode] = useState<CheckInMode>("universityId");
  const [screen, setScreen] = useState<Screen>("welcome");
  const [value, setValue] = useState("");
  const [dob, setDob] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [language, setLanguage] = useState(languages[0]);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isComplete = screen === "complete";
  const canContinue =
    mode === "qr"
      ? true
      : mode === "universityId"
        ? value.trim().length >= 3 && dob.trim().length >= 4
        : value.trim().length >= 2 && dob.trim().length >= 4;
  const canVerify = otp.every((digit) => digit.length === 1);

  const handleContinue = () => {
    if (!canContinue) {
      setError(
        mode === "universityId"
          ? "Please enter your university ID and date of birth."
          : "Please enter your last name and date of birth.",
      );
      return;
    }
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setScreen(mode === "qr" ? "complete" : "code");
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
    setDob("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  return (
    <main
      className="kiosk-shell relative min-h-[100dvh] overflow-hidden text-[#3f2222]"
      style={{
        background:
          "radial-gradient(circle at 8% 0%, rgba(248,226,228,.95), transparent 30%), #fbf5e9",
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
          background-image: radial-gradient(rgba(153,0,0,.12) .7px, transparent .7px);
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
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#990000] text-[#fbf5e9] shadow-[0_8px_20px_rgba(153,0,0,.16)]">
            <HeartPulse size={23} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-.03em] text-[#990000]">
              IU Student Health Center
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#8d756b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c35b45]" />
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
              className="flex min-h-11 items-center gap-2 rounded-full border border-[#e4d4bf] bg-[#fffaf1]/80 px-4 text-sm font-semibold text-[#632c2c] transition hover:border-[#c9a69a] hover:bg-[#f8ede0] focus:outline-none focus:ring-2 focus:ring-[#c35b45]/40"
            >
              <Globe2 size={16} />
              <span>{language.short}</span>
              <ChevronDown size={15} className={languageOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-14 z-30 w-40 rounded-2xl border border-[#e4d4bf] bg-[#fffaf1] p-1.5 shadow-[0_16px_34px_rgba(108,35,35,.16)]">
                {languages.map((item) => (
                  <button
                    key={item.short}
                    type="button"
                    onClick={() => {
                      setLanguage(item);
                      setLanguageOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-[#632c2c] hover:bg-[#f4e6d3]"
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
            className="flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-[#7c5b52] transition hover:bg-[#f8ede0] focus:outline-none focus:ring-2 focus:ring-[#c35b45]/40"
          >
            <HelpCircle size={17} />
            <span className="hidden sm:inline">Need help?</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-7 px-6 pb-8 pt-2 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(470px,548px)] lg:gap-12 lg:px-14 lg:pb-14 lg:pt-6">
        <section className="kiosk-display flex flex-col justify-center lg:min-h-[650px]">
          <div className="max-w-[520px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e1c9bb] bg-[#f4e6d3] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#7f4d4d]">
              <Sparkles size={14} className="text-[#c35b45]" />
              Your campus health visit
            </div>
            <h1
              className="max-w-[510px] text-[clamp(2.75rem,5vw,5.15rem)] font-semibold leading-[.98] tracking-[-.065em] text-[#990000]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Welcome, Hoosier. We&apos;re glad you&apos;re here.
            </h1>
            <p className="mt-6 max-w-[420px] text-[17px] leading-7 text-[#806861]">
              Check in for your appointment in a few quick steps. Your health information stays private and secure.
            </p>

            <div className="mt-10 grid max-w-[500px] grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-[#e7d9c7] bg-[#fffaf1]/80 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f2d9bd] text-[#8b3a3a]">
                  <Clock3 size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#632c2c]">Takes about 2 minutes</p>
                  <p className="mt-1 text-xs leading-5 text-[#9a8074]">No paperwork to carry.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[#e7d9c7] bg-[#fffaf1]/80 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f3e1dc] text-[#9a5147]">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#632c2c]">Private by design</p>
                  <p className="mt-1 text-xs leading-5 text-[#9a8074]">Your session clears when done.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 flex items-center gap-2 text-xs font-medium text-[#9a8478]">
            <LockKeyhole size={14} />
            <span>For your privacy, please use this screen alone.</span>
          </div>
        </section>

         <section className="kiosk-card relative flex min-h-[560px] flex-col justify-center rounded-[30px] border border-[#e7d9c7] bg-[#fffaf1] p-6 shadow-[0_24px_60px_rgba(108,35,35,.12)] sm:p-9 lg:min-h-[610px] lg:p-11">
           <div className="absolute right-0 top-0 h-32 w-32 overflow-hidden rounded-tr-[30px]">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full border-[18px] border-[#f4e6d3]" />
            <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full border-[12px] border-[#f2d9bd]" />
          </div>

          {isComplete ? (
            <div className="kiosk-fade flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-[27px] bg-[#f3e1dc] text-[#990000]">
                <CircleCheckBig size={42} strokeWidth={1.7} />
              </div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#9a6b5f]">You&apos;re checked in</p>
              <h2 className="max-w-[380px] text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.04] tracking-[-.055em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Your visit is ready.
              </h2>
              <p className="mt-5 max-w-[350px] text-[16px] leading-7 text-[#806861]">
                Please take a seat in the waiting area. A Student Health Center team member will be with you shortly.
              </p>
              <div className="mt-8 w-full max-w-[350px] rounded-2xl border border-[#ebdeca] bg-[#f8efe3] p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2d9bd] text-[#8b3a3a]"><CalendarDays size={17} /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-[#9a8074]">Today&apos;s visit</p>
                    <p className="mt-0.5 text-sm font-bold text-[#632c2c]">IU Student Health Center</p>
                  </div>
                </div>
              </div>
              <button type="button" onClick={startOver} className="mt-8 flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-bold text-[#7a4646] hover:bg-[#f4e6d3] focus:outline-none focus:ring-2 focus:ring-[#c35b45]/40">
                Start another check-in <ArrowRight size={16} />
              </button>
            </div>
          ) : screen === "code" ? (
            <div className="kiosk-fade">
              <button type="button" onClick={() => { setScreen("welcome"); setError(""); }} className="mb-8 flex min-h-10 items-center gap-2 text-sm font-bold text-[#8b675b] hover:text-[#990000] focus:outline-none focus:ring-2 focus:ring-[#c35b45]/40">
                <ArrowLeft size={17} /> Back
              </button>
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2d9bd] text-[#8b3a3a]">
                <KeyRound size={26} strokeWidth={1.8} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a8074]">One more step</p>
              <h2 className="mt-3 text-[clamp(2rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-.05em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Enter your secure code
              </h2>
              <p className="mt-4 max-w-[390px] text-[15px] leading-6 text-[#806861]">
                We sent a 6-digit code to the contact method on file. This sample screen does not connect to live patient data.
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
                    className="h-14 min-w-0 flex-1 rounded-xl border border-[#d9c6b5] bg-[#fffaf1] text-center text-xl font-bold text-[#990000] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-2 focus:ring-[#990000]/15"
                  />
                ))}
              </div>
              {error && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#a23939]"><AlertCircle size={16} />{error}</p>}
              <button type="button" onClick={verifyCode} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#990000] px-5 text-[15px] font-bold text-[#fffaf1] shadow-[0_9px_18px_rgba(153,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#7a0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20">
                Verify and continue <ArrowRight size={18} />
              </button>
              <button type="button" onClick={() => setError("A new code would be sent here in the connected kiosk.")} className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 text-sm font-bold text-[#7f4f4f] hover:text-[#990000]">
                <MessageCircleMore size={16} /> Didn&apos;t receive a code?
              </button>
            </div>
          ) : (
            <div className="kiosk-fade">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a8074]">Start your check-in</p>
                <h2 className="mt-3 text-[clamp(2rem,3.5vw,2.8rem)] font-semibold leading-[1.05] tracking-[-.05em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  How would you like to begin?
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#f3e5d8] p-1.5" role="tablist" aria-label="Check-in method">
                <button type="button" role="tab" aria-selected={mode === "universityId"} onClick={() => { setMode("universityId"); setValue(""); setDob(""); setError(""); }} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#990000]/30 sm:text-sm ${mode === "universityId" ? "bg-[#fffaf1] text-[#990000] shadow-[0_3px_10px_rgba(108,35,35,.1)]" : "text-[#9a8074] hover:text-[#632c2c]"}`}>
                  <BadgeCheck size={16} /> University ID
                </button>
                <button type="button" role="tab" aria-selected={mode === "lastName"} onClick={() => { setMode("lastName"); setValue(""); setDob(""); setError(""); }} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#990000]/30 sm:text-sm ${mode === "lastName" ? "bg-[#fffaf1] text-[#990000] shadow-[0_3px_10px_rgba(108,35,35,.1)]" : "text-[#9a8074] hover:text-[#632c2c]"}`}>
                  <UserRound size={16} /> Last name
                </button>
                <button type="button" role="tab" aria-selected={mode === "qr"} onClick={() => { setMode("qr"); setValue(""); setDob(""); setError(""); }} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#990000]/30 sm:text-sm ${mode === "qr" ? "bg-[#fffaf1] text-[#990000] shadow-[0_3px_10px_rgba(108,35,35,.1)]" : "text-[#9a8074] hover:text-[#632c2c]"}`}>
                  <QrCode size={16} /> QR code
                </button>
              </div>

              <div className="mt-7">
                {mode === "qr" ? (
                  <div className="rounded-2xl border border-dashed border-[#d9bdb0] bg-[#fffaf1] p-5 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f3e1dc] text-[#990000]">
                      <ScanLine size={38} strokeWidth={1.6} />
                    </div>
                    <p className="mt-4 text-sm font-bold text-[#632c2c]">Scan your visit QR code</p>
                    <p className="mx-auto mt-1.5 max-w-[300px] text-xs leading-5 text-[#9a8074]">
                      Use the QR code from your appointment message. It securely identifies your visit without displaying your ID numbers.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="checkin-value" className="mb-2.5 block text-sm font-bold text-[#632c2c]">
                        {mode === "universityId" ? "University ID" : "Last name"}
                      </label>
                      <div className="relative">
                        {mode === "universityId" ? <BadgeCheck size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8074]" /> : <UserRound size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8074]" />}
                        <input
                          id="checkin-value"
                          type="text"
                          inputMode={mode === "universityId" ? "text" : "text"}
                          autoComplete="off"
                          value={value}
                          onChange={(event) => { setValue(event.target.value); setError(""); }}
                          placeholder={mode === "universityId" ? "e.g. iu123456" : "e.g. Johnson"}
                          className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] pl-12 pr-4 text-[16px] font-semibold tracking-[.01em] text-[#632c2c] outline-none transition placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                          aria-describedby="privacy-note"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="checkin-dob" className="mb-2.5 block text-sm font-bold text-[#632c2c]">Date of birth</label>
                      <div className="relative">
                        <CalendarDays size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8074]" />
                        <input
                          id="checkin-dob"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={dob}
                          onChange={(event) => { setDob(event.target.value); setError(""); }}
                          placeholder="MM / DD / YYYY"
                          className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] pl-12 pr-4 text-[16px] font-semibold tracking-[.01em] text-[#632c2c] outline-none transition placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {error && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#a23939]"><AlertCircle size={16} />{error}</p>}
              </div>

              <button type="button" disabled={loading} onClick={handleContinue} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#990000] px-5 text-[15px] font-bold text-[#fffaf1] shadow-[0_9px_18px_rgba(153,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#7a0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20 disabled:cursor-wait disabled:opacity-90">
                {loading ? (
                  <>
                     <span className="kiosk-shimmer flex items-center gap-1.5" aria-hidden="true"><span className="h-1.5 w-1.5 rounded-full bg-[#fffaf1]" /><span className="h-1.5 w-1.5 rounded-full bg-[#fffaf1]" /><span className="h-1.5 w-1.5 rounded-full bg-[#fffaf1]" /></span>
                    Preparing your secure check-in
                  </>
                ) : <>{mode === "qr" ? "Scan and continue" : "Continue securely"} <ArrowRight size={18} /></>}
              </button>

              <p id="privacy-note" className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#9a8478]">
                <LockKeyhole size={14} className="mt-0.5 shrink-0" />
                We&apos;ll only use this to find your visit and verify your identity. Nothing is saved on this screen.
              </p>
            </div>
          )}
        </section>
      </div>

      {showHelp && (
        <div className="fixed bottom-5 right-5 z-40 w-[min(350px,calc(100vw-40px))] rounded-2xl border border-[#e4d4bf] bg-[#fffaf1] p-5 shadow-[0_18px_42px_rgba(108,35,35,.2)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#990000]">Need a hand?</p>
              <p className="mt-1.5 text-sm leading-5 text-[#806861]">Ask a Student Health Center team member if you need assistance or do not have your phone.</p>
            </div>
            <button type="button" aria-label="Close help" onClick={() => setShowHelp(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8f756a] hover:bg-[#f4e6d3]"><span className="text-xl leading-none">×</span></button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f8efe3] px-3 py-2.5 text-xs font-bold text-[#7f4f4f]"><Stethoscope size={15} /> Student Health Center assistance is available.</div>
        </div>
      )}
    </main>
  );
}