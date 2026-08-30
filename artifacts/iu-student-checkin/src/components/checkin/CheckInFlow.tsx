import { useState, useEffect } from "react";
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
  LockKeyhole,
  MapPin,
  MessageCircleMore,
  PenLine,
  QrCode,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { 
  useIdentifyCheckIn,
  useSaveCheckInAppointment,
  useSaveCheckInDemographics,
  useSaveCheckInCoverage,
  useSaveCheckInConsent,
  useSaveCheckInQuestionnaire,
  useSaveCheckInHistory,
  useCompleteCheckIn,
  useHealthCheck,
} from "@workspace/api-client-react";
import type { CheckInSession, CompletionResult, CheckInIdentificationMethod } from "@workspace/api-client-react";

type CheckInMode = "universityId" | "lastName" | "qr";
type Coverage = "iu" | "other" | "self";
type Answer = "yes" | "no" | "unsure";
type Screen =
  | "welcome"
  | "appointment"
  | "demographics"
  | "coverage"
  | "consent"
  | "questionnaire"
  | "history"
  | "checking"
  | "complete";

const languages = [
  { label: "English", short: "EN", supportsInterface: true },
  { label: "Español · interpreter", short: "ES", supportsInterface: false },
  { label: "中文 · interpreter", short: "中", supportsInterface: false },
];

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return fallback;
  }
  const data = (error as { data?: { error?: unknown } }).data;
  return typeof data?.error === "string" ? data.error : fallback;
};

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

function formatDateOfBirth(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function CheckInFlow() {
  const [mode, setMode] = useState<CheckInMode>("universityId");
  const [screen, setScreen] = useState<Screen>("welcome");
  
  // API State
  const [session, setSession] = useState<CheckInSession | null>(null);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);

  // Form State
  const [value, setValue] = useState("");
  const [dob, setDob] = useState("");
  const [language, setLanguage] = useState(languages[0]);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTopic, setHelpTopic] = useState<"general" | "language">("general");
  const [error, setError] = useState("");
  
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [coverage, setCoverage] = useState<Coverage>("iu");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [historyChoice, setHistoryChoice] = useState<"same" | "update" | "">("");
  
  // Sync demographics from session when fetched
  useEffect(() => {
    if (session?.student) {
      setFirstName(session.student.firstName || "");
      setLastName(session.student.lastName || "");
      setPhone(session.student.phone || "");
      setEmail(session.student.email || "");
    }
  }, [session]);

  // API Hooks
  const { data: healthStatus } = useHealthCheck();
  const identifyMutation = useIdentifyCheckIn();
  const saveAppointmentMutation = useSaveCheckInAppointment();
  const saveDemographicsMutation = useSaveCheckInDemographics();
  const saveCoverageMutation = useSaveCheckInCoverage();
  const saveConsentMutation = useSaveCheckInConsent();
  const saveQuestionnaireMutation = useSaveCheckInQuestionnaire();
  const saveHistoryMutation = useSaveCheckInHistory();
  const completeMutation = useCompleteCheckIn();

  const isMutating = 
    identifyMutation.isPending || 
    saveAppointmentMutation.isPending ||
    saveDemographicsMutation.isPending ||
    saveCoverageMutation.isPending ||
    saveConsentMutation.isPending ||
    saveQuestionnaireMutation.isPending ||
    saveHistoryMutation.isPending ||
    completeMutation.isPending;

  const activeStepIndex = journeySteps.findIndex((step) => step.id === screen);
  const isJourney = activeStepIndex >= 0;
  const canContinue =
    mode === "qr"
      ? true
      : mode === "universityId"
        ? value.trim().length >= 3 && dob.length === 10
        : value.trim().length >= 2 && dob.length === 10;

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
    
    identifyMutation.mutate({
      data: {
        method: mode as CheckInIdentificationMethod,
        value: mode !== "qr" ? value : undefined,
        dateOfBirth: mode !== "qr" ? dob : undefined,
        qrToken: mode === "qr" ? "demo-qr-token" : undefined
      }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setSelectedAppointment(data.appointments?.[0]?.id ?? "");
        setScreen("appointment");
      },
      onError: (err: unknown) => {
        setError(getApiErrorMessage(err, "We couldn't find a matching demo visit. Use the sample details shown on this screen."));
      }
    });
  };

  const goBack = () => {
    clearError();
    const previous: Partial<Record<Screen, Screen>> = {
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
    setSession(null);
    setMode("universityId");
    setValue("");
    setDob("");
    setSelectedAppointment("");
    setCoverage("iu");
    setConsentAccepted(false);
    setSignatureName("");
    setAnswers({});
    setHistoryChoice("");
    clearError();
    setShowHelp(false);
    setLanguageOpen(false);
  };

  const continueAppointment = () => {
    if (!selectedAppointment || !session?.sessionId) {
      setError("Select the appointment you’re checking in for.");
      return;
    }
    clearError();
    saveAppointmentMutation.mutate({
      sessionId: session.sessionId,
      data: { appointmentId: selectedAppointment }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setScreen("demographics");
      },
      onError: () => setError("Failed to save appointment. Please try again.")
    });
  };

  const continueDemographics = () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      setError("Please complete each field so we know how to reach you.");
      return;
    }
    if (!session?.sessionId) return;
    clearError();
    saveDemographicsMutation.mutate({
      sessionId: session.sessionId,
      data: { firstName, lastName, phone, email }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setScreen("coverage");
      },
      onError: () => setError("Failed to save details. Please try again.")
    });
  };

  const continueConsent = () => {
    if (!consentAccepted || signatureName.trim().length < 2) {
      setError("Please review the consent and add your signature to continue.");
      return;
    }
    if (!session?.sessionId) return;
    clearError();
    saveConsentMutation.mutate({
      sessionId: session.sessionId,
      data: { accepted: consentAccepted, signatureName }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setScreen("questionnaire");
      },
      onError: () => setError("Failed to save consent. Please try again.")
    });
  };

  const continueQuestions = () => {
    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer each question before continuing.");
      return;
    }
    if (!session?.sessionId) return;
    clearError();
    saveQuestionnaireMutation.mutate({
      sessionId: session.sessionId,
      data: { answers }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setScreen("history");
      },
      onError: () => setError("Failed to save questionnaire. Please try again.")
    });
  };

  const continueHistory = () => {
    if (!historyChoice) {
      setError("Choose an option so your care team has the latest information.");
      return;
    }
    if (!session?.sessionId) return;
    clearError();
    setScreen("checking");
    
    saveHistoryMutation.mutate({
      sessionId: session.sessionId,
      data: { choice: historyChoice }
    }, {
      onSuccess: (data) => {
        setSession(data);
        completeMutation.mutate({
          sessionId: session!.sessionId
        }, {
          onSuccess: (res) => {
            setCompletion(res);
            setScreen("complete");
          },
          onError: () => {
            setScreen("history");
            setError("Failed to finalize check-in. Please try again.");
          }
        });
      },
      onError: () => {
        setScreen("history");
        setError("Failed to save history. Please try again.");
      }
    });
  };

  const continueCoverage = () => {
    if (!session?.sessionId) return;
    clearError();
    saveCoverageMutation.mutate({
      sessionId: session.sessionId,
      data: { coverage }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setScreen("consent");
      },
      onError: () => setError("Failed to save coverage. Please try again.")
    });
  };

  const renderError = () =>
    error ? (
      <p
        role="alert"
        data-testid="error-message"
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
    testId = "button-continue"
  ) => (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled || isMutating}
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#990000] px-5 text-[15px] font-bold text-[#fff9ed] shadow-[0_10px_22px_rgba(122,0,0,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isMutating ? (
        <>
          <span className="kiosk-pulse flex items-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fff9ed]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#fff9ed]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#fff9ed]" />
          </span>
          Working securely
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
      data-testid="button-back"
      disabled={isMutating}
      onClick={goBack}
      className="mb-6 flex min-h-10 items-center gap-2 text-sm font-bold text-[#806259] transition hover:text-[#990000] focus:outline-none focus:ring-2 focus:ring-[#990000]/25 disabled:opacity-50"
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
      }}
    >
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
            <p data-testid="status-demo" className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#9a5147]">
              Demo mode · sample data only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {screen !== "welcome" && screen !== "complete" && screen !== "checking" && (
            <button
              type="button"
              data-testid="button-start-over"
              onClick={startOver}
              className="hidden min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-bold text-[#806259] transition hover:bg-[#f4e6d5] hover:text-[#990000] focus:outline-none focus:ring-2 focus:ring-[#990000]/25 sm:flex"
            >
              Start over
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              data-testid="button-language"
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
                    data-testid={`button-lang-${item.short}`}
                    onClick={() => {
                      setLanguageOpen(false);
                      if (item.supportsInterface) {
                        setLanguage(item);
                      } else {
                        setHelpTopic("language");
                        setShowHelp(true);
                      }
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
            data-testid="button-help"
            aria-haspopup="dialog"
            onClick={() => {
              setHelpTopic("general");
              setShowHelp(true);
            }}
            className="flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-[#806259] transition hover:bg-[#f8ede0] focus:outline-none focus:ring-2 focus:ring-[#990000]/25"
          >
            <HelpCircle size={17} />
            <span className="hidden sm:inline">Need help?</span>
          </button>
        </div>
      </header>

      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3d2626]/35 p-5 backdrop-blur-sm"
          role="presentation"
          onClick={() => setShowHelp(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-dialog-title"
            data-testid="dialog-help"
            onClick={(event) => event.stopPropagation()}
            className="kiosk-fade w-full max-w-md rounded-[26px] border border-[#e7d9c7] bg-[#fffaf1] p-6 shadow-[0_28px_80px_rgba(61,38,38,.24)] sm:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#9a8074]">
                  {helpTopic === "language" ? "Language support" : "We’re here to help"}
                </p>
                <h2 id="help-dialog-title" className="mt-2 text-2xl font-semibold tracking-[-.035em] text-[#990000] font-serif">
                  {helpTopic === "language" ? "An interpreter can join you." : "Ask a staff member anytime."}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close help"
                data-testid="button-close-help"
                onClick={() => setShowHelp(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e2d2bf] text-[#806259] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
              >
                <X size={19} />
              </button>
            </div>
            <p className="mt-5 text-[15px] leading-7 text-[#806960]">
              {helpTopic === "language"
                ? "This demo is currently available in English. IU Student Health Center staff can arrange language assistance before you continue."
                : "Raise your hand or visit the front desk. Staff can help with finding your visit, using the QR code, accessibility needs, or any question you would rather answer in person."}
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f4e6d5] p-4 text-sm leading-6 text-[#632f2f]">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#990000]" />
              <span>You can ask for help without sharing health details on this screen.</span>
            </div>
            <button
              type="button"
              data-testid="button-help-done"
              onClick={() => setShowHelp(false)}
              className="mt-6 min-h-12 w-full rounded-xl bg-[#990000] px-5 text-sm font-bold text-[#fff9ed] transition hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
            >
              Return to check-in
            </button>
          </section>
        </div>
      )}

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
                <h1
                  className="max-w-[590px] text-[clamp(3.15rem,5.4vw,5.55rem)] font-semibold leading-[.95] tracking-[-.07em] text-[#990000] font-serif"
                >
                  Welcome, Hoosier.
                  <span className="block text-[#bd5b48]">Thank you for trusting us with your care.</span>
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
                  className="max-w-[650px] text-[clamp(4.6rem,10vw,8.8rem)] font-semibold uppercase leading-[.82] tracking-[-.09em] text-[#990000] font-serif"
                  data-testid="text-floor"
                >
                  {completion?.floorLabel || "Destination"}
                </h1>
                <div className="mt-7 flex items-center gap-4 border-l-[5px] border-[#990000] pl-5">
                  <MapPin size={32} className="shrink-0 text-[#990000]" />
                  <p className="text-[clamp(1.8rem,3.3vw,3rem)] font-bold leading-none tracking-[-.05em] text-[#3d2626]" data-testid="text-waiting-area">
                    {completion?.waitingArea || "Waiting area"}
                  </p>
                </div>
                <p className="mt-7 max-w-[560px] text-[17px] leading-7 text-[#806960]" data-testid="text-directions">
                  {completion?.directions}
                </p>
              </div>
            ) : screen === "checking" ? (
               <div className="max-w-[560px]">
                <h1
                  className="max-w-[570px] text-[clamp(3rem,5.1vw,5.2rem)] font-semibold leading-[.96] tracking-[-.07em] text-[#990000] font-serif"
                >
                  Finishing up...
                </h1>
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
                  className="mt-3 max-w-[520px] text-[clamp(2.75rem,4.6vw,4.7rem)] font-semibold leading-[.97] tracking-[-.065em] text-[#990000] font-serif"
                >
                  {screen === "appointment" && "Let's find your visit."}
                  {screen === "demographics" && "Let's make sure we have it right."}
                  {screen === "coverage" && "How will today's visit be covered?"}
                  {screen === "consent" && "A quick review before we begin."}
                  {screen === "questionnaire" && "A few things for your care team."}
                  {screen === "history" && "Anything changed since your last visit?"}
                </h1>
                <p className="mt-6 max-w-[430px] text-[16px] leading-7 text-[#806960]">
                  {screen === "appointment" && "Choose the appointment you're here for today."}
                  {screen === "demographics" && "Review your details so we can keep your visit moving smoothly."}
                  {screen === "coverage" && "Choose the option that best describes your plan today."}
                  {screen === "consent" && "Please read the short notice, then sign to acknowledge."}
                  {screen === "questionnaire" && "Your answers help us prepare for a more useful conversation."}
                  {screen === "history" && "A quick confirmation helps us keep your record current."}
                </p>
              </div>
            )}
            
            {screen !== "complete" && screen !== "checking" && (
              <div className="mt-10 flex items-center gap-2 text-xs font-medium text-[#9a8478]">
                <LockKeyhole size={14} />
                <span>For your privacy, please use this screen alone.</span>
              </div>
            )}
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
                  <h2 className="mt-3 text-[clamp(2.1rem,3.5vw,2.9rem)] font-semibold leading-[1.03] tracking-[-.055em] text-[#990000] font-serif">
                    How would you like to begin?
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#f3e5d8] p-1.5" role="tablist" aria-label="Check-in method">
                  {([
                    ["universityId", "University ID", <BadgeCheck size={16} key="id" />],
                    ["lastName", "Last name", <UserRound size={16} key="name" />],
                    ["qr", "QR code", <QrCode size={16} key="qr" />],
                  ] as const).map(([itemMode, label, icon]) => (
                    <button
                      key={itemMode}
                      type="button"
                      role="tab"
                      aria-selected={mode === itemMode}
                      data-testid={`tab-${itemMode}`}
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
                        This demo simulates the iPad camera using a sample QR token. No image is captured or stored.
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
                            data-testid="input-value"
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
                            data-testid="input-dob"
                            value={dob}
                            onChange={(event) => {
                              setDob(formatDateOfBirth(event.target.value));
                              clearError();
                            }}
                            maxLength={10}
                            placeholder="MM/DD/YYYY"
                            className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] pl-12 pr-4 text-[16px] font-semibold tracking-[.01em] text-[#632f2f] outline-none transition placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {renderError()}

                  <div className="mt-8">
                    {primaryButton(
                      mode === "qr" ? "Use demo QR code" : "Find my visit",
                      handleContinue,
                      !canContinue,
                      undefined,
                      "button-identify"
                    )}
                  </div>
                </div>
              </div>
            )}

            {screen === "appointment" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                  Which appointment are you checking in for?
                </h2>

                <div className="space-y-3">
                  {session?.appointments?.map((apt) => (
                    <label
                      key={apt.id}
                      data-testid={`appointment-${apt.id}`}
                      className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition hover:bg-[#fff6e8] ${selectedAppointment === apt.id ? "border-[#990000] bg-[#fff6e8] shadow-[0_4px_14px_rgba(153,0,0,.08)]" : "border-[#d9c6b5] bg-[#fffaf1]"}`}
                    >
                      <div className="mt-0.5 flex items-center justify-center">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${selectedAppointment === apt.id ? "border-[#990000] bg-[#990000]" : "border-[#c1aba0] bg-transparent"}`}>
                          {selectedAppointment === apt.id && <Check size={14} className="text-[#fff9ed]" strokeWidth={3} />}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="appointment"
                        value={apt.id}
                        checked={selectedAppointment === apt.id}
                        onChange={(e) => {
                          setSelectedAppointment(e.target.value);
                          clearError();
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                          <p className="text-base font-bold text-[#632f2f]">{apt.time}</p>
                          <span className="inline-flex items-center rounded-full bg-[#f4e6d5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#7f4d4d]">
                            {apt.date}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[#806960]">{apt.type}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#9a8074]">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope size={14} /> {apt.provider}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} /> {apt.location}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                  
                  {(!session?.appointments || session.appointments.length === 0) && (
                    <div className="p-8 text-center text-[#806960] border border-[#d9c6b5] rounded-2xl bg-[#fffaf1]">
                      No upcoming appointments found for today.
                    </div>
                  )}
                </div>

                {renderError()}

                <div className="mt-8">
                  {primaryButton("Confirm appointment", continueAppointment, !selectedAppointment, undefined, "button-save-appointment")}
                </div>
              </div>
            )}

            {screen === "demographics" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                  Contact details
                </h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-first" className="mb-2 block text-sm font-bold text-[#632f2f]">First name</label>
                    <input
                      id="demo-first"
                      type="text"
                      data-testid="input-first-name"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); clearError(); }}
                      className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="demo-last" className="mb-2 block text-sm font-bold text-[#632f2f]">Last name</label>
                    <input
                      id="demo-last"
                      type="text"
                      data-testid="input-last-name"
                      value={lastName}
                      onChange={(e) => { setLastName(e.target.value); clearError(); }}
                      className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="demo-phone" className="mb-2 block text-sm font-bold text-[#632f2f]">Mobile phone</label>
                    <input
                      id="demo-phone"
                      type="tel"
                      data-testid="input-phone"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); clearError(); }}
                      className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="demo-email" className="mb-2 block text-sm font-bold text-[#632f2f]">Email address</label>
                    <input
                      id="demo-email"
                      type="email"
                      data-testid="input-email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearError(); }}
                      className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-[#f4e6d5] p-3 text-xs font-semibold leading-5 text-[#806259]">
                  <Info size={14} className="mr-1.5 inline -translate-y-[1px]" />
                  Need to update your preferred name or pronouns? You can do that securely through the Student Portal or at the front desk.
                </div>

                {renderError()}

                <div className="mt-8">
                  {primaryButton("Looks good", continueDemographics, !firstName || !lastName || !phone || !email, undefined, "button-save-demographics")}
                </div>
              </div>
            )}

            {screen === "coverage" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                  Billing & Coverage
                </h2>

                <div className="space-y-3">
                  {([
                    ["iu", "Bill IU Student Insurance", "We have your plan on file."],
                    ["other", "Bill a different insurance plan", "You'll be asked to provide your card."],
                    ["self", "I will pay out of pocket", "No insurance will be billed."],
                  ] as const).map(([val, title, desc]) => (
                    <label
                      key={val}
                      className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition hover:bg-[#fff6e8] ${coverage === val ? "border-[#990000] bg-[#fff6e8] shadow-[0_4px_14px_rgba(153,0,0,.08)]" : "border-[#d9c6b5] bg-[#fffaf1]"}`}
                    >
                      <div className="mt-0.5 flex items-center justify-center">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${coverage === val ? "border-[#990000] bg-[#990000]" : "border-[#c1aba0] bg-transparent"}`}>
                          {coverage === val && <Check size={14} className="text-[#fff9ed]" strokeWidth={3} />}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="coverage"
                        data-testid={`coverage-${val}`}
                        value={val}
                        checked={coverage === val}
                        onChange={(e) => {
                          setCoverage(e.target.value as Coverage);
                          clearError();
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-base font-bold text-[#632f2f]">{title}</p>
                        <p className="mt-1 text-sm font-medium text-[#806960]">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {renderError()}

                <div className="mt-8">
                  {primaryButton("Confirm coverage", continueCoverage, !coverage, undefined, "button-save-coverage")}
                </div>
              </div>
            )}

            {screen === "consent" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                  Consent to Treat
                </h2>

                <div className="mb-6 max-h-48 overflow-y-auto rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-4 text-sm font-medium leading-relaxed text-[#806960]">
                  <p className="mb-3">
                    By proceeding, I voluntarily consent to medical care, diagnostic procedures, and treatment by IU Student Health Center personnel. I understand that I have the right to ask questions about my treatment and discuss any concerns with my provider.
                  </p>
                  <p>
                    I also acknowledge receipt of the Notice of Privacy Practices, detailing how my health information may be used and disclosed.
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-[#c1aba0] bg-[#fffaf1] transition-colors focus-within:ring-2 focus-within:ring-[#990000]/50" style={{ borderColor: consentAccepted ? "#990000" : undefined, backgroundColor: consentAccepted ? "#990000" : undefined }}>
                    {consentAccepted && <Check size={16} className="text-[#fff9ed]" strokeWidth={3} />}
                    <input
                      type="checkbox"
                      data-testid="input-consent"
                      checked={consentAccepted}
                      onChange={(e) => {
                        setConsentAccepted(e.target.checked);
                        clearError();
                      }}
                      className="sr-only"
                    />
                  </div>
                  <span className="text-[15px] font-bold text-[#632f2f]">
                    I have read and agree to the Consent to Treat
                  </span>
                </label>

                <div className="mt-6">
                  <label htmlFor="signature" className="mb-2 block text-sm font-bold text-[#632f2f]">Type your full name to sign</label>
                  <div className="relative">
                    <PenLine size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8074]" />
                    <input
                      id="signature"
                      type="text"
                      data-testid="input-signature"
                      value={signatureName}
                      onChange={(e) => { setSignatureName(e.target.value); clearError(); }}
                      placeholder="Your name"
                      className="min-h-14 w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] pl-11 pr-4 font-serif text-[18px] font-medium tracking-wide text-[#632f2f] outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-semibold placeholder:tracking-normal placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                    />
                  </div>
                </div>

                {renderError()}

                <div className="mt-8">
                  {primaryButton("Sign and continue", continueConsent, !consentAccepted || signatureName.length < 2, undefined, "button-save-consent")}
                </div>
              </div>
            )}

            {screen === "questionnaire" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                  Pre-visit questions
                </h2>

                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-5">
                      <p className="mb-3 text-[15px] font-bold text-[#632f2f]">
                        {qIndex + 1}. {q.title}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => {
                          const isSelected = answers[q.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              data-testid={`question-${q.id}-${opt.value}`}
                              onClick={() => {
                                setAnswers({ ...answers, [q.id]: opt.value });
                                clearError();
                              }}
                              className={`rounded-xl border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#990000]/30 ${isSelected ? "border-[#990000] bg-[#fff6e8] text-[#990000] shadow-[0_2px_8px_rgba(153,0,0,.08)]" : "border-[#e0c6ba] bg-transparent text-[#806960] hover:bg-[#f4e6d5]"}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {renderError()}

                <div className="mt-8">
                  {primaryButton("Save answers", continueQuestions, Object.keys(answers).length !== questions.length, undefined, "button-save-questionnaire")}
                </div>
              </div>
            )}

            {screen === "history" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                  Medical history
                </h2>

                <div className="mb-6 rounded-2xl bg-[#f4e6d5] p-5 text-[15px] font-medium leading-relaxed text-[#806259]">
                  Please let us know if there have been any major changes to your medical history, surgeries, or family history since your last visit.
                </div>

                <div className="space-y-3">
                  {([
                    ["same", "No changes", "My history is exactly the same as my last visit."],
                    ["update", "I have updates", "I need to add or change something in my record."],
                  ] as const).map(([val, title, desc]) => (
                    <label
                      key={val}
                      className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition hover:bg-[#fff6e8] ${historyChoice === val ? "border-[#990000] bg-[#fff6e8] shadow-[0_4px_14px_rgba(153,0,0,.08)]" : "border-[#d9c6b5] bg-[#fffaf1]"}`}
                    >
                      <div className="mt-0.5 flex items-center justify-center">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${historyChoice === val ? "border-[#990000] bg-[#990000]" : "border-[#c1aba0] bg-transparent"}`}>
                          {historyChoice === val && <Check size={14} className="text-[#fff9ed]" strokeWidth={3} />}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="history"
                        value={val}
                        data-testid={`history-${val}`}
                        checked={historyChoice === val}
                        onChange={(e) => {
                          setHistoryChoice(e.target.value as any);
                          clearError();
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-base font-bold text-[#632f2f]">{title}</p>
                        <p className="mt-1 text-sm font-medium text-[#806960]">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {renderError()}

                <div className="mt-8">
                  {primaryButton("Complete check-in", continueHistory, !historyChoice, <CircleCheckBig size={18} />, "button-complete-checkin")}
                </div>
              </div>
            )}
            
            {screen === "checking" && (
              <div className="kiosk-fade flex min-h-[400px] flex-col items-center justify-center text-center">
                <span className="kiosk-pulse flex items-center gap-2 mb-6" aria-hidden="true">
                  <span className="h-3 w-3 rounded-full bg-[#990000]" />
                  <span className="h-3 w-3 rounded-full bg-[#990000]" />
                  <span className="h-3 w-3 rounded-full bg-[#990000]" />
                </span>
                <p className="text-lg font-bold text-[#632f2f]">Finalizing your check-in...</p>
                <p className="mt-2 text-sm text-[#806960]">Securely saving your responses.</p>
              </div>
            )}

            {screen === "complete" && (
              <div className="kiosk-fade flex min-h-[510px] flex-col">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#806960]">
                  <Check size={16} className="text-[#316148]" />
                  Visit confirmed
                </div>
                <dl className="mt-6 divide-y divide-[#e7d9c7]">
                  <div className="py-4 first:pt-0">
                    <dt className="text-xs font-semibold uppercase tracking-[.12em] text-[#806960]">Provider</dt>
                    <dd className="mt-1 text-lg font-bold text-[#3d2626]" data-testid="text-provider">{completion?.provider}</dd>
                  </div>
                  <div className="py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[.12em] text-[#806960]">Visit</dt>
                    <dd className="mt-1 text-lg font-bold text-[#3d2626]" data-testid="text-visit-type">{completion?.visitType}</dd>
                  </div>
                  <div className="py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[.12em] text-[#806960]">Time</dt>
                    <dd className="mt-1 text-lg font-bold text-[#3d2626]" data-testid="text-appointment-time">{completion?.appointmentTime}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  data-testid="button-finish"
                  onClick={startOver}
                  className="mt-auto flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#990000] px-6 text-[16px] font-bold text-[#fff9ed] shadow-[0_10px_22px_rgba(122,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
                >
                  Done
                  <ArrowRight size={18} />
                </button>
                <p className="mt-4 text-center text-[11px] leading-5 text-[#806960]">
                  Demo / sample data only. No patient information is displayed.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Health Status Indicator (Staff only) */}
      <div className="absolute bottom-4 left-4 z-50 flex items-center gap-1.5 opacity-30 transition hover:opacity-100">
        <div className={`h-2 w-2 rounded-full ${healthStatus?.status === 'ok' ? 'bg-[#316148]' : 'bg-[#990000]'}`} />
        <span className="text-[10px] font-semibold text-[#806259]">{healthStatus?.status === 'ok' ? 'System Online' : 'Connecting...'}</span>
      </div>
    </main>
  );
}
