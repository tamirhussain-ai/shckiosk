import { useRef, useState, type KeyboardEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  CreditCard,
  FileCheck2,
  Globe2,
  HeartPulse,
  HelpCircle,
  Info,
  KeyRound,
  LockKeyhole,
  MapPin,
  MessageCircleMore,
  PenLine,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

type CheckInMode = "universityId" | "lastName" | "qr";
type Coverage = "iu" | "other" | "self";
type Answer = "yes" | "no" | "unsure";
type Screen =
  | "welcome"
  | "code"
  | "appointment"
  | "demographics"
  | "coverage"
  | "consent"
  | "questionnaire"
  | "history"
  | "checking"
  | "complete";

const languages = [
  { label: "English", short: "EN" },
  { label: "Español", short: "ES" },
  { label: "中文", short: "中" },
];

const appointments = [
  {
    id: "first",
    time: "10:30 AM",
    date: "Today, October 14",
    provider: "Maya Patel, MD",
    type: "Primary care visit",
    location: "Student Health Center · First floor",
  },
  {
    id: "second",
    time: "2:15 PM",
    date: "Today, October 14",
    provider: "Jordan Lewis, NP",
    type: "Wellness visit",
    location: "Student Health Center · First floor",
  },
];

const questions = [
  {
    id: "feeling",
    title: "How are you feeling today?",
    options: [
      { value: "yes" as Answer, label: "Good" },
      { value: "unsure" as Answer, label: "Okay" },
      { value: "no" as Answer, label: "Not well" },
    ],
  },
  {
    id: "medications",
    title: "Have your medications changed since your last visit?",
    options: [
      { value: "yes" as Answer, label: "Yes" },
      { value: "no" as Answer, label: "No" },
      { value: "unsure" as Answer, label: "Not sure" },
    ],
  },
  {
    id: "safety",
    title: "Do you have anything urgent you want your care team to know?",
    options: [
      { value: "yes" as Answer, label: "Yes" },
      { value: "no" as Answer, label: "No" },
      { value: "unsure" as Answer, label: "I’d like to talk about it" },
    ],
  },
];

const journeySteps = [
  { id: "appointment", label: "Visit" },
  { id: "demographics", label: "Details" },
  { id: "coverage", label: "Coverage" },
  { id: "consent", label: "Consent" },
  { id: "questionnaire", label: "Questions" },
  { id: "history", label: "History" },
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
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [firstName, setFirstName] = useState("Avery");
  const [lastName, setLastName] = useState("Johnson");
  const [phone, setPhone] = useState("(812) 555-0148");
  const [email, setEmail] = useState("avery.johnson@iu.edu");
  const [coverage, setCoverage] = useState<Coverage>("iu");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [historyChoice, setHistoryChoice] = useState<"same" | "update" | "">("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const activeStepIndex = journeySteps.findIndex((step) => step.id === screen);
  const isJourney = activeStepIndex >= 0;
  const canContinue =
    mode === "qr"
      ? true
      : mode === "universityId"
        ? value.trim().length >= 3 && dob.trim().length >= 4
        : value.trim().length >= 2 && dob.trim().length >= 4;
  const canVerify = otp.every((digit) => digit.length === 1);

  const clearError = () => setError("");

  const handleContinue = () => {
    if (!canContinue) {
      setError(
        mode === "universityId"
          ? "Enter your university ID and date of birth to continue."
          : "Enter your last name and date of birth to continue.",
      );
      return;
    }
    clearError();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setScreen(mode === "qr" ? "appointment" : "code");
    }, mode === "qr" ? 950 : 600);
  };

  const handleOtpChange = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    clearError();
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
    clearError();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setScreen("appointment");
    }, 650);
  };

  const goBack = () => {
    clearError();
    const previous: Partial<Record<Screen, Screen>> = {
      code: "welcome",
      appointment: "welcome",
      demographics: "appointment",
      coverage: "demographics",
      consent: "coverage",
      questionnaire: "consent",
      history: "questionnaire",
      checking: "history",
    };
    const next = previous[screen];
    if (next) setScreen(next);
  };

  const startOver = () => {
    setScreen("welcome");
    setMode("universityId");
    setValue("");
    setDob("");
    setOtp(["", "", "", "", "", ""]);
    setSelectedAppointment("");
    setCoverage("iu");
    setConsentAccepted(false);
    setSignatureName("");
    setAnswers({});
    setHistoryChoice("");
    clearError();
    setLoading(false);
  };

  const continueAppointment = () => {
    if (!selectedAppointment) {
      setError("Select the appointment you’re checking in for.");
      return;
    }
    clearError();
    setScreen("demographics");
  };

  const continueDemographics = () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      setError("Please complete each field so we know how to reach you.");
      return;
    }
    clearError();
    setScreen("coverage");
  };

  const continueConsent = () => {
    if (!consentAccepted || signatureName.trim().length < 2) {
      setError("Please review the consent and add your signature to continue.");
      return;
    }
    clearError();
    setScreen("questionnaire");
  };

  const continueQuestions = () => {
    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer each question before continuing.");
      return;
    }
    clearError();
    setScreen("history");
  };

  const continueHistory = () => {
    if (!historyChoice) {
      setError("Choose an option so your care team has the latest information.");
      return;
    }
    clearError();
    setScreen("checking");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setScreen("complete");
    }, 1300);
  };

  const renderError = () =>
    error ? (
      <p
        role="alert"
        className="mt-4 flex items-start gap-2 rounded-xl border border-[#e8b9ad] bg-[#fff0ec] px-3.5 py-3 text-sm font-semibold leading-5 text-[#9a2929]"
      >
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
        {error}
      </p>
    ) : null;

  const primaryButton = (
    label: string,
    onClick: () => void,
    disabled = false,
    icon = <ArrowRight size={18} />,
  ) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#990000] px-5 text-[15px] font-bold text-[#fff9ed] shadow-[0_10px_22px_rgba(122,0,0,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20 disabled:cursor-wait disabled:opacity-80"
    >
      {disabled ? (
        <>
          <span className="kiosk-pulse flex items-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fff9ed]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#fff9ed]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#fff9ed]" />
          </span>
          Checking securely
        </>
      ) : (
        <>
          {label}
          {icon}
        </>
      )}
    </button>
  );

  const renderBack = () => (
    <button
      type="button"
      onClick={goBack}
      className="mb-6 flex min-h-10 items-center gap-2 text-sm font-bold text-[#806259] transition hover:text-[#990000] focus:outline-none focus:ring-2 focus:ring-[#990000]/25"
    >
      <ArrowLeft size={17} /> Back
    </button>
  );

  return (
    <main
      className="kiosk-shell relative min-h-[100dvh] overflow-hidden text-[#3d2626]"
      style={{
        background:
          "radial-gradient(circle at 5% -5%, rgba(245,216,215,.9), transparent 30%), radial-gradient(circle at 100% 100%, rgba(237,222,193,.62), transparent 32%), #fbf5e8",
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
          opacity: .2;
          background-image: radial-gradient(rgba(153,0,0,.13) .7px, transparent .7px);
          background-size: 18px 18px;
          mask-image: linear-gradient(145deg, black, transparent 68%);
          z-index: -1;
        }
        .kiosk-reveal { animation: kiosk-reveal .55s cubic-bezier(.22,.8,.32,1) both; }
        .kiosk-card { animation: kiosk-card .65s cubic-bezier(.22,.8,.32,1) .05s both; }
        .kiosk-fade { animation: kiosk-fade .32s ease both; }
        .kiosk-pulse { animation: kiosk-pulse 1.15s ease-in-out infinite; }
        @keyframes kiosk-reveal { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes kiosk-card { from { opacity: 0; transform: translateY(16px) scale(.987) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes kiosk-fade { from { opacity: 0; transform: translateX(9px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes kiosk-pulse { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .kiosk-reveal, .kiosk-card, .kiosk-fade, .kiosk-pulse { animation: none; }
        }
      `}</style>

      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#990000] text-[#fff9ed] shadow-[0_8px_20px_rgba(153,0,0,.16)]">
            <HeartPulse size={23} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-.035em] text-[#990000]">
              IU Student Health Center
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#8d756b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bd5b48]" />
              Bloomington campus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {screen !== "welcome" && screen !== "complete" && (
            <button
              type="button"
              onClick={startOver}
              className="hidden min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-bold text-[#806259] transition hover:bg-[#f4e6d5] hover:text-[#990000] focus:outline-none focus:ring-2 focus:ring-[#990000]/25 sm:flex"
            >
              Start over
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              aria-expanded={languageOpen}
              onClick={() => setLanguageOpen((open) => !open)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-[#e2d2bf] bg-[#fffaf1]/80 px-3.5 text-sm font-semibold text-[#632f2f] transition hover:border-[#c9a69a] hover:bg-[#f8ede0] focus:outline-none focus:ring-2 focus:ring-[#990000]/25"
            >
              <Globe2 size={16} />
              <span>{language.short}</span>
              <ChevronDown
                size={15}
                className={languageOpen ? "rotate-180 transition-transform" : "transition-transform"}
              />
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-14 z-30 w-40 rounded-2xl border border-[#e2d2bf] bg-[#fffaf1] p-1.5 shadow-[0_16px_34px_rgba(108,35,35,.16)]">
                {languages.map((item) => (
                  <button
                    key={item.short}
                    type="button"
                    onClick={() => {
                      setLanguage(item);
                      setLanguageOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-[#632f2f] transition hover:bg-[#f4e6d5]"
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
            className="flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-[#806259] transition hover:bg-[#f8ede0] focus:outline-none focus:ring-2 focus:ring-[#990000]/25"
          >
            <HelpCircle size={17} />
            <span className="hidden sm:inline">Need help?</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1370px] px-6 pb-9 sm:px-10 lg:px-14 lg:pb-14">
        {isJourney && (
          <nav
            aria-label="Check-in progress"
            className="kiosk-reveal mb-8 flex items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-[#eadccb] bg-[#fffaf1]/70 px-4 py-3.5 lg:mb-10 lg:px-6"
          >
            {journeySteps.map((step, index) => {
              const isCurrent = index === activeStepIndex;
              const isDone = index < activeStepIndex;
              return (
                <div key={step.id} className="flex min-w-max flex-1 items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isDone
                          ? "bg-[#dce8df] text-[#316148]"
                          : isCurrent
                            ? "bg-[#990000] text-[#fff9ed]"
                            : "bg-[#f1e7d8] text-[#a18c7c]"
                      }`}
                    >
                      {isDone ? <Check size={14} strokeWidth={2.5} /> : index + 1}
                    </span>
                    <span
                      className={`hidden text-xs font-bold sm:inline ${
                        isCurrent ? "text-[#990000]" : isDone ? "text-[#316148]" : "text-[#a18c7c]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < journeySteps.length - 1 && (
                    <span className={`mx-1 h-px flex-1 ${isDone ? "bg-[#b8d0bd]" : "bg-[#e6d7c4]"}`} />
                  )}
                </div>
              );
            })}
          </nav>
        )}

        <div className={`grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.82fr)_minmax(540px,1.18fr)] lg:gap-16 ${isJourney ? "lg:items-start" : "lg:items-center"}`}>
          <section className="kiosk-reveal flex flex-col justify-center lg:min-h-[590px]">
            {screen === "welcome" ? (
              <div className="max-w-[610px]">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e0c6ba] bg-[#f4e6d5] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#7f4d4d]">
                  <Sparkles size={14} className="text-[#bd5b48]" />
                  A calmer arrival starts here
                </div>
                <h1
                  className="max-w-[590px] text-[clamp(3.15rem,5.4vw,5.55rem)] font-semibold leading-[.95] tracking-[-.07em] text-[#990000]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  Welcome, Hoosier.
                  <span className="block text-[#bd5b48]">We&apos;re glad you&apos;re here.</span>
                </h1>
                <p className="mt-7 max-w-[480px] text-[17px] leading-7 text-[#806960]">
                  Check in for your visit in a few simple steps. Take your time — your health information stays private throughout.
                </p>
                <div className="mt-10 grid max-w-[570px] grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-[#e7d9c7] bg-[#fffaf1]/80 p-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2d9bd] text-[#8b3a3a]">
                      <Clock3 size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#632f2f]">About 2 minutes</p>
                      <p className="mt-1 text-xs leading-5 text-[#9a8074]">No paperwork to carry.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-[#e7d9c7] bg-[#fffaf1]/80 p-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3e1dc] text-[#9a5147]">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#632f2f]">Private by design</p>
                      <p className="mt-1 text-xs leading-5 text-[#9a8074]">This screen clears when done.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : screen === "complete" ? (
              <div className="max-w-[560px]">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9ddcd] bg-[#e6f0e5] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#316148]">
                  <CheckCircle2 size={14} />
                  Check-in complete
                </div>
                <h1
                  className="max-w-[570px] text-[clamp(3rem,5.1vw,5.2rem)] font-semibold leading-[.96] tracking-[-.07em] text-[#990000]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  You&apos;re in good hands.
                </h1>
                <p className="mt-7 max-w-[450px] text-[17px] leading-7 text-[#806960]">
                  Your care team has your check-in. Find a seat in the waiting area and we&apos;ll call your name shortly.
                </p>
                <div className="mt-9 flex items-center gap-2 text-xs font-semibold text-[#8d756b]">
                  <LockKeyhole size={14} />
                  Your information is no longer visible on this screen.
                </div>
              </div>
            ) : (
              <div className="max-w-[520px]">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3e1dc] text-[#990000]">
                  {screen === "appointment" ? <CalendarDays size={23} /> : screen === "demographics" ? <UserRound size={23} /> : screen === "coverage" ? <CreditCard size={23} /> : screen === "consent" ? <FileCheck2 size={23} /> : screen === "questionnaire" ? <ClipboardList size={23} /> : <ShieldCheck size={23} />}
                </div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a8074]">
                  Step {activeStepIndex + 1} of {journeySteps.length}
                </p>
                <h1
                  className="mt-3 max-w-[520px] text-[clamp(2.75rem,4.6vw,4.7rem)] font-semibold leading-[.97] tracking-[-.065em] text-[#990000]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  {screen === "appointment" && "Let’s find your visit."}
                  {screen === "demographics" && "Let’s make sure we have it right."}
                  {screen === "coverage" && "How will today’s visit be covered?"}
                  {screen === "consent" && "A quick review before we begin."}
                  {screen === "questionnaire" && "A few things for your care team."}
                  {screen === "history" && "Anything changed since your last visit?"}
                </h1>
                <p className="mt-6 max-w-[430px] text-[16px] leading-7 text-[#806960]">
                  {screen === "appointment" && "Choose the appointment you’re here for today."}
                  {screen === "demographics" && "Review your details so we can keep your visit moving smoothly."}
                  {screen === "coverage" && "Choose the option that best describes your plan today."}
                  {screen === "consent" && "Please read the short notice, then sign to acknowledge."}
                  {screen === "questionnaire" && "Your answers help us prepare for a more useful conversation."}
                  {screen === "history" && "A quick confirmation helps us keep your record current."}
                </p>
              </div>
            )}
            <div className="mt-10 flex items-center gap-2 text-xs font-medium text-[#9a8478]">
              <LockKeyhole size={14} />
              <span>For your privacy, please use this screen alone.</span>
            </div>
          </section>

          <section className="kiosk-card relative min-h-[580px] rounded-[30px] border border-[#e7d9c7] bg-[#fffaf1] p-6 shadow-[0_25px_65px_rgba(108,35,35,.12)] sm:p-9 lg:min-h-[610px] lg:p-11">
            <div className="absolute right-0 top-0 h-32 w-32 overflow-hidden rounded-tr-[30px]">
              <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full border-[18px] border-[#f4e6d5]" />
              <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full border-[12px] border-[#f2d9bd]" />
            </div>

            {screen === "welcome" && (
              <div className="kiosk-fade relative">
                <div className="mb-7">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a8074]">Start your check-in</p>
                  <h2 className="mt-3 text-[clamp(2.1rem,3.5vw,2.9rem)] font-semibold leading-[1.03] tracking-[-.055em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    How would you like to begin?
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#f3e5d8] p-1.5" role="tablist" aria-label="Check-in method">
                  {([
                    ["universityId", "University ID", <BadgeCheck size={16} />],
                    ["lastName", "Last name", <UserRound size={16} />],
                    ["qr", "QR code", <QrCode size={16} />],
                  ] as const).map(([itemMode, label, icon]) => (
                    <button
                      key={itemMode}
                      type="button"
                      role="tab"
                      aria-selected={mode === itemMode}
                      onClick={() => {
                        setMode(itemMode);
                        setValue("");
                        setDob("");
                        clearError();
                      }}
                      className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#990000]/30 sm:text-sm ${mode === itemMode ? "bg-[#fffaf1] text-[#990000] shadow-[0_3px_10px_rgba(108,35,35,.1)]" : "text-[#9a8074] hover:text-[#632f2f]"}`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-7">
                  {mode === "qr" ? (
                    <div className="rounded-2xl border border-dashed border-[#d9bdb0] bg-[#fffaf1] px-5 py-6 text-center">
                      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-[#f3e1dc] text-[#990000]">
                        <ScanLine size={42} strokeWidth={1.6} />
                        <span className="absolute inset-3 rounded-lg border-2 border-[#990000]/35" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-[#632f2f]">Use the QR code from your text</p>
                      <p className="mx-auto mt-1.5 max-w-[350px] text-xs leading-5 text-[#9a8074]">
                        Open the text message on your phone, then hold its QR code in front of the iPad camera. We’ll identify your visit without showing your ID numbers.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="checkin-value" className="mb-2.5 block text-sm font-bold text-[#632f2f]">
                          {mode === "universityId" ? "University ID" : "Last name"}
                        </label>
                        <div className="relative">
                          {mode === "universityId" ? <BadgeCheck size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8074]" /> : <UserRound size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8074]" />}
                          <input
                            id="checkin-value"
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            value={value}
                            onChange={(event) => {
                              setValue(event.target.value);
                              clearError();
                            }}
                            placeholder={mode === "universityId" ? "e.g. iu123456" : "e.g. Johnson"}
                            className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] pl-12 pr-4 text-[16px] font-semibold tracking-[.01em] text-[#632f2f] outline-none transition placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="checkin-dob" className="mb-2.5 block text-sm font-bold text-[#632f2f]">Date of birth</label>
                        <div className="relative">
                          <CalendarDays size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8074]" />
                          <input
                            id="checkin-dob"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={dob}
                            onChange={(event) => {
                              setDob(event.target.value);
                              clearError();
                            }}
                            placeholder="MM / DD / YYYY"
                            className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] pl-12 pr-4 text-[16px] font-semibold tracking-[.01em] text-[#632f2f] outline-none transition placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {renderError()}
                </div>
                <div className="mt-7">{primaryButton(mode === "qr" ? "Scan with iPad camera" : "Continue securely", handleContinue, loading)}</div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#9a8478]">
                  <LockKeyhole size={14} className="mt-0.5 shrink-0" />
                  We’ll only use this to find your visit and verify your identity. Nothing is saved on this screen.
                </p>
              </div>
            )}

            {screen === "code" && (
              <div className="kiosk-fade">
                {renderBack()}
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2d9bd] text-[#8b3a3a]">
                  <KeyRound size={26} strokeWidth={1.8} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a8074]">One more step</p>
                <h2 className="mt-3 text-[clamp(2.1rem,3.5vw,2.9rem)] font-semibold leading-[1.03] tracking-[-.055em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  Enter your secure code
                </h2>
                <p className="mt-4 max-w-[420px] text-[15px] leading-6 text-[#806960]">
                  We sent a 6-digit code to the contact method on file. This sample accepts any six digits.
                </p>
                <div className="mt-8 flex gap-2.5 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
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
                {renderError()}
                <div className="mt-7">{primaryButton("Verify and continue", verifyCode, loading)}</div>
                <button
                  type="button"
                  onClick={() => setError("In the connected kiosk, a new code would be sent to the contact method on file.")}
                  className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 text-sm font-bold text-[#7f4f4f] transition hover:text-[#990000]"
                >
                  <MessageCircleMore size={16} /> Didn’t receive a code?
                </button>
              </div>
            )}

            {screen === "appointment" && (
              <div className="kiosk-fade">
                {renderBack()}
                <div className="space-y-3">
                  {appointments.map((appointment) => {
                    const selected = selectedAppointment === appointment.id;
                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedAppointment(appointment.id);
                          clearError();
                        }}
                        className={`flex min-h-[116px] w-full items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${selected ? "border-[#990000] bg-[#fff2e7] shadow-[0_5px_14px_rgba(153,0,0,.08)]" : "border-[#eadccb] bg-[#fffaf1] hover:border-[#cba9a0] hover:bg-[#fff8ef]"}`}
                      >
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[#990000] bg-[#990000] text-[#fff9ed]" : "border-[#d2bdb0]"}`}>
                          {selected && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-lg font-bold text-[#632f2f]">{appointment.time}</span>
                            <span className="rounded-full bg-[#f4e6d5] px-2.5 py-1 text-[11px] font-bold text-[#8b6256]">{appointment.date}</span>
                          </span>
                          <span className="mt-2 block text-sm font-bold text-[#7a4e4e]">{appointment.type}</span>
                          <span className="mt-1 block text-xs text-[#9a8074]">{appointment.provider} · {appointment.location}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setShowHelp(true)} className="mt-5 flex min-h-10 items-center gap-2 text-sm font-bold text-[#7f4f4f] hover:text-[#990000]">
                  <HelpCircle size={16} /> I don’t see my appointment
                </button>
                {renderError()}
                <div className="mt-7">{primaryButton("Confirm this visit", continueAppointment)}</div>
              </div>
            )}

            {screen === "demographics" && (
              <div className="kiosk-fade">
                {renderBack()}
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["First name", firstName, setFirstName, "demo-first"],
                    ["Last name", lastName, setLastName, "demo-last"],
                    ["Mobile number", phone, setPhone, "demo-phone"],
                    ["Email address", email, setEmail, "demo-email"],
                  ].map(([label, fieldValue, setter, id]) => (
                    <label key={id as string} htmlFor={id as string} className="block">
                      <span className="mb-2.5 block text-sm font-bold text-[#632f2f]">{label as string}</span>
                      <input
                        id={id as string}
                        type="text"
                        value={fieldValue as string}
                        onChange={(event) => {
                          (setter as (value: string) => void)(event.target.value);
                          clearError();
                        }}
                        className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#f8efe3] px-3.5 py-3 text-xs leading-5 text-[#8c7468]">
                  <Info size={15} className="mt-0.5 shrink-0 text-[#a05b4d]" />
                  Only your care team will see these details. You can ask the front desk to update anything later.
                </div>
                {renderError()}
                <div className="mt-7">{primaryButton("Details look right", continueDemographics)}</div>
              </div>
            )}

            {screen === "coverage" && (
              <div className="kiosk-fade">
                {renderBack()}
                <div className="space-y-3">
                  {([
                    ["iu", "IU Student Insurance", "Use my IU student plan"],
                    ["other", "Another insurance plan", "I’ll share a different plan"],
                    ["self", "I’m paying out of pocket", "Self-pay for today’s visit"],
                  ] as const).map(([valueKey, title, description]) => {
                    const selected = coverage === valueKey;
                    return (
                      <button
                        key={valueKey}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setCoverage(valueKey);
                          clearError();
                        }}
                        className={`flex min-h-[76px] w-full items-center gap-4 rounded-2xl border px-4 text-left transition sm:px-5 ${selected ? "border-[#990000] bg-[#fff2e7]" : "border-[#eadccb] bg-[#fffaf1] hover:border-[#cba9a0]"}`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[#990000] bg-[#990000] text-[#fff9ed]" : "border-[#d2bdb0]"}`}>
                          {selected && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span>
                          <span className="block text-[15px] font-bold text-[#632f2f]">{title}</span>
                          <span className="mt-1 block text-xs text-[#9a8074]">{description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#f8efe3] px-3.5 py-3 text-xs leading-5 text-[#8c7468]">
                  <CreditCard size={15} className="mt-0.5 shrink-0 text-[#a05b4d]" />
                  You won’t be asked for payment on this screen.
                </div>
                <div className="mt-7">{primaryButton("Continue to consent", () => setScreen("consent"))}</div>
              </div>
            )}

            {screen === "consent" && (
              <div className="kiosk-fade">
                {renderBack()}
                <div className="rounded-2xl border border-[#eadccb] bg-[#fdf7ed] p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2d9bd] text-[#8b3a3a]">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#632f2f]">Consent for care</p>
                      <p className="mt-2 text-sm leading-6 text-[#806960]">
                        I understand that the Student Health Center will use my information to provide and coordinate care. I can ask questions before signing.
                      </p>
                    </div>
                  </div>
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadccb] bg-[#fffaf1] p-4">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(event) => {
                      setConsentAccepted(event.target.checked);
                      clearError();
                    }}
                    className="mt-1 h-5 w-5 accent-[#990000]"
                  />
                  <span className="text-sm font-semibold leading-6 text-[#632f2f]">I have read and agree to the consent notice above.</span>
                </label>
                <label htmlFor="signature" className="mt-5 block">
                  <span className="mb-2.5 flex items-center gap-2 text-sm font-bold text-[#632f2f]"><PenLine size={16} /> Type your full name as your signature</span>
                  <input
                    id="signature"
                    type="text"
                    value={signatureName}
                    onChange={(event) => {
                      setSignatureName(event.target.value);
                      clearError();
                    }}
                    placeholder="Avery Johnson"
                    className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[17px] italic text-[#632f2f] outline-none transition placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                  />
                </label>
                {renderError()}
                <div className="mt-7">{primaryButton("Agree and continue", continueConsent)}</div>
              </div>
            )}

            {screen === "questionnaire" && (
              <div className="kiosk-fade">
                {renderBack()}
                <div className="space-y-5">
                  {questions.map((question, questionIndex) => (
                    <fieldset key={question.id}>
                      <legend className="mb-2.5 text-sm font-bold leading-5 text-[#632f2f]">
                        <span className="mr-1.5 text-[#b36b58]">{questionIndex + 1}.</span>
                        {question.title}
                      </legend>
                      <div className="grid grid-cols-3 gap-2">
                        {question.options.map((option) => {
                          const selected = answers[question.id] === option.value;
                          return (
                            <button
                              key={option.label}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                setAnswers((current) => ({ ...current, [question.id]: option.value }));
                                clearError();
                              }}
                              className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition sm:text-sm ${selected ? "border-[#990000] bg-[#990000] text-[#fff9ed]" : "border-[#eadccb] bg-[#fffaf1] text-[#806259] hover:border-[#cba9a0] hover:text-[#632f2f]"}`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
                {renderError()}
                <div className="mt-7">{primaryButton("Save answers", continueQuestions)}</div>
              </div>
            )}

            {screen === "history" && (
              <div className="kiosk-fade">
                {renderBack()}
                <div className="rounded-2xl border border-[#eadccb] bg-[#fdf7ed] p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3e1dc] text-[#990000]">
                      <Stethoscope size={18} />
                    </div>
                    <p className="text-sm leading-6 text-[#806960]">
                      This includes medications, allergies, and immunizations. You can update anything with your care team during the visit.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {([
                    ["same", "Nothing has changed", "My history is up to date", <CheckCircle2 size={20} />],
                    ["update", "I need to update something", "I’ll talk with my care team", <PenLine size={20} />],
                  ] as const).map(([choice, title, description, icon]) => {
                    const selected = historyChoice === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setHistoryChoice(choice);
                          clearError();
                        }}
                        className={`flex min-h-[128px] flex-col items-start rounded-2xl border p-4 text-left transition ${selected ? "border-[#990000] bg-[#fff2e7]" : "border-[#eadccb] bg-[#fffaf1] hover:border-[#cba9a0]"}`}
                      >
                        <span className={selected ? "text-[#990000]" : "text-[#9a8074]"}>{icon}</span>
                        <span className="mt-4 text-sm font-bold text-[#632f2f]">{title}</span>
                        <span className="mt-1 text-xs text-[#9a8074]">{description}</span>
                      </button>
                    );
                  })}
                </div>
                {renderError()}
                <div className="mt-7">{primaryButton("Finish check-in", continueHistory, loading)}</div>
              </div>
            )}

            {screen === "checking" && (
              <div className="kiosk-fade flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="relative mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#f3e1dc] text-[#990000]">
                  <ScanLine size={43} strokeWidth={1.5} />
                  <span className="absolute left-4 right-4 top-1/2 h-px bg-[#990000]/45" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a6b5f]">One moment</p>
                <h2 className="mt-3 text-[clamp(2.1rem,3.5vw,2.9rem)] font-semibold leading-[1.03] tracking-[-.055em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  Securing your check-in
                </h2>
                <p className="mt-5 max-w-[330px] text-[15px] leading-6 text-[#806960]">
                  We’re sending your completed details to the Student Health Center team.
                </p>
              </div>
            )}

            {screen === "complete" && (
              <div className="kiosk-fade flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-[27px] bg-[#e3efe5] text-[#316148]">
                  <CircleCheckBig size={43} strokeWidth={1.7} />
                </div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#6a9274]">You’re checked in</p>
                <h2 className="max-w-[400px] text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-.06em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  Your visit is ready.
                </h2>
                <p className="mt-5 max-w-[360px] text-[16px] leading-7 text-[#806960]">
                  Please take a seat in the waiting area. A team member will call your name shortly.
                </p>
                <div className="mt-8 w-full max-w-[390px] rounded-2xl border border-[#d7e4d8] bg-[#f0f6ef] p-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dcebdd] text-[#316148]"><MapPin size={17} /></div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.12em] text-[#6a9274]">Next step</p>
                      <p className="mt-1 text-sm font-bold text-[#355b41]">Wait near the front desk</p>
                      <p className="mt-1 text-xs leading-5 text-[#66816d]">Keep your phone nearby in case your care team sends an update.</p>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={startOver} className="mt-7 flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-[#7a4646] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-2 focus:ring-[#990000]/25">
                  Start another check-in <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#3d2626]/15 p-5 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="help-title" className="w-full max-w-[430px] rounded-[26px] border border-[#e2d2bf] bg-[#fffaf1] p-6 shadow-[0_22px_55px_rgba(108,35,35,.22)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.17em] text-[#9a8074]">Student support</p>
                <h2 id="help-title" className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#990000]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Need a hand?</h2>
              </div>
              <button type="button" aria-label="Close help" onClick={() => setShowHelp(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-[#8f756a] transition hover:bg-[#f4e6d5] hover:text-[#990000]"><X size={19} /></button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#806960]">
              A Student Health Center team member can help you check in, find an appointment, or use another language.
            </p>
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-3 rounded-xl bg-[#f8efe3] px-3.5 py-3 text-sm font-semibold text-[#7f4f4f]"><Stethoscope size={17} /> Ask at the front desk</div>
              <div className="flex items-center gap-3 rounded-xl bg-[#f8efe3] px-3.5 py-3 text-sm font-semibold text-[#7f4f4f]"><MessageCircleMore size={17} /> We can check you in together</div>
            </div>
            <button type="button" onClick={() => setShowHelp(false)} className="mt-6 min-h-12 w-full rounded-2xl border border-[#d9c6b5] px-4 text-sm font-bold text-[#632f2f] transition hover:bg-[#f8ede0] focus:outline-none focus:ring-2 focus:ring-[#990000]/25">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}