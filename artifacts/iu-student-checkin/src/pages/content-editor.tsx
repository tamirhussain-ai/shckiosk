import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  LayoutPanelTop,
  LockKeyhole,
  Menu,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  useGetKioskContent,
  useResetKioskContent,
  useUpdateKioskContent,
} from "@workspace/api-client-react";
import type { KioskContent } from "@workspace/api-client-react";

type ScreenId =
  | "welcome"
  | "appointment"
  | "details"
  | "coverage"
  | "consent"
  | "questions"
  | "checking"
  | "complete";

type ScreenContent = Record<string, string>;
type EditableContent = Record<ScreenId, ScreenContent>;
type Notice = { tone: "success" | "error" | "info"; text: string };

const screenOrder: ScreenId[] = [
  "welcome",
  "appointment",
  "details",
  "coverage",
  "consent",
  "questions",
  "checking",
  "complete",
];

const screenDetails: Record<
  ScreenId,
  { label: string; eyebrow: string; description: string; number: string }
> = {
  welcome: {
    label: "Welcome",
    eyebrow: "01 / First impression",
    description: "The first thing a student sees at the kiosk.",
    number: "01",
  },
  appointment: {
    label: "Appointment",
    eyebrow: "02 / Find a visit",
    description: "Instructions for selecting today’s appointment.",
    number: "02",
  },
  details: {
    label: "Details",
    eyebrow: "03 / Confirm details",
    description: "Prompts for contact and address information.",
    number: "03",
  },
  coverage: {
    label: "Coverage",
    eyebrow: "04 / Insurance",
    description: "Coverage choices and insurance guidance.",
    number: "04",
  },
  consent: {
    label: "Consent",
    eyebrow: "05 / Permissions",
    description: "Consent language and signature instructions.",
    number: "05",
  },
  questions: {
    label: "Questions",
    eyebrow: "06 / Check-in questions",
    description: "Short pre-visit questions for the care team.",
    number: "06",
  },
  checking: {
    label: "Checking",
    eyebrow: "07 / Processing",
    description: "The brief confirmation shown while submitting.",
    number: "07",
  },
  complete: {
    label: "Complete",
    eyebrow: "08 / Finish",
    description: "Directions and reassurance after check-in.",
    number: "08",
  },
};

const defaultContent: EditableContent = {
  welcome: {
    eyebrow: "Start your check-in",
    title: "Welcome, Hoosier.",
    titleAccent: "Thank you for trusting us with your care.",
    description:
      "Check in for your visit in a few simple steps. Take your time — your health information stays private throughout.",
    duration: "About 2 minutes",
    durationNote: "No paperwork to carry.",
    startEyebrow: "Start your check-in",
    startTitle: "How would you like to begin?",
    privacyNote: "For your privacy, please use this screen alone.",
    demoInstructions:
      "Demo: use iu123456 for scheduled visits or iu000000 for no scheduled appointment, with 10/14/2003.",
    qrPrompt: "Use the QR code from your text",
    qrDescription:
      "This demo simulates the iPad camera using a sample QR token. No image is captured or stored.",
    findVisitButton: "Find my visit",
    qrButton: "Use demo QR code",
  },
  appointment: {
    scheduledHeading: "Which appointment are you checking in for?",
    scheduledDescription: "Choose the appointment you're here for today.",
    confirmButton: "Confirm appointment",
    noAppointmentHeading: "No scheduled appointment found",
    noAppointmentDescription:
      "You can still get help today. Choose the option that works best for you.",
    frontDeskLabel: "Visit the front desk",
    frontDeskDescription:
      "A team member can look for your visit or help you make an appointment.",
    scheduleLabel: "Schedule online",
    scheduleDescription: "Use the self-service scheduler QR code or link.",
    frontDeskConfirmation:
      "Please take your student ID to the front desk. You do not need to enter more information here.",
    schedulingHeading: "Schedule an appointment online",
    schedulingUnavailable:
      "The scheduler connection is not available on this kiosk. Ask the front desk for the current scheduling QR code or link.",
    backToOptionsButton: "Back to appointment options",
  },
  details: { heading: "Contact details", continueButton: "Looks good" },
  coverage: {
    heading: "Billing & Coverage",
    description: "Choose the option that best describes your plan today.",
    selfPayTitle: "Self Pay",
    selfPayDescription: "No insurance plan will be billed for this visit.",
    iuOptionTitle: "Bill IU Student Insurance",
    iuOptionDescription: "We have your plan on file.",
    otherOptionTitle: "Bill a different insurance plan",
    otherOptionDescription: "Enter the information from your insurance card.",
    insuranceHeading: "Insurance information",
    updateInsuranceButton: "Return and update insurance information",
    viewInsuranceButton: "View insurance information",
    confirmButton: "Confirm coverage",
  },
  consent: {
    heading: "Consent to Treat",
    noticeFirstParagraph:
      "By proceeding, I voluntarily consent to medical care, diagnostic procedures, and treatment by IU Student Health Center personnel. I understand that I have the right to ask questions about my treatment and discuss any concerns with my provider.",
    noticeSecondParagraph:
      "I also acknowledge receipt of the Notice of Privacy Practices, detailing how my health information may be used and disclosed.",
    agreementLabel: "I have read and agree to the Consent to Treat",
    signatureLabel: "Type your full name to sign",
    signaturePlaceholder: "Your name",
    continueButton: "Sign and continue",
  },
  questions: {
    heading: "Pre-visit questions",
    description: "Your answers help us prepare for a more useful conversation.",
    continueButton: "Save answers",
  },
  checking: { heading: "Finishing up...", description: "Securely saving your responses." },
  complete: {
    badge: "Check-in complete",
    kioskFloorPrefix: "This kiosk is on the",
    directionsSuffix: "Your Care team is expecting you.",
    destinationFallback: "Destination",
    waitingAreaFallback: "Waiting area",
    visitConfirmed: "Visit confirmed",
    providerLabel: "Provider",
    visitLabel: "Visit",
    timeLabel: "Time",
    doneButton: "Done",
    demoNotice: "Demo / sample data only. No patient information is displayed.",
  },
};

const fieldCopy: Partial<
  Record<ScreenId, Record<string, { label: string; hint?: string; multiline?: boolean }>>
> = {
  welcome: {
    title: { label: "Headline", hint: "Keep this short and welcoming." },
    subtitle: { label: "Supporting message", hint: "One sentence that sets expectations." },
    helperText: { label: "Help text", multiline: true },
    primaryAction: { label: "Primary button label" },
    privacyNote: { label: "Privacy note", multiline: true },
  },
  appointment: {
    title: { label: "Headline" },
    subtitle: { label: "Supporting message" },
    appointmentPrompt: { label: "Appointment prompt", multiline: true },
    helpText: { label: "Help text", multiline: true },
    noAppointmentText: { label: "No appointment option" },
  },
  details: {
    title: { label: "Headline" },
    subtitle: { label: "Supporting message" },
    addressPrompt: { label: "Address prompt", multiline: true },
    phonePrompt: { label: "Phone prompt", multiline: true },
    helperText: { label: "Help text", multiline: true },
  },
  coverage: {
    title: { label: "Headline" },
    subtitle: { label: "Supporting message" },
    iuInsuranceLabel: { label: "IU insurance option" },
    otherInsuranceLabel: { label: "Other insurance option" },
    selfPayLabel: { label: "Self-pay option" },
    helperText: { label: "Help text", multiline: true },
  },
  consent: {
    title: { label: "Headline" },
    subtitle: { label: "Supporting message" },
    consentBody: { label: "Consent language", hint: "Use plain language; this is shown before signature.", multiline: true },
    signatureLabel: { label: "Signature prompt" },
    helperText: { label: "Help text", multiline: true },
  },
  questions: {
    title: { label: "Headline" },
    subtitle: { label: "Supporting message" },
    questionIntro: { label: "Question introduction", multiline: true },
    urgentHelpText: { label: "Urgent help message", multiline: true },
    helperText: { label: "Help text", multiline: true },
  },
  checking: {
    title: { label: "Headline" },
    subtitle: { label: "Supporting message" },
    progressText: { label: "Progress message", multiline: true },
    helpText: { label: "Help text", multiline: true },
  },
  complete: {
    title: { label: "Headline" },
    subtitle: { label: "Supporting message" },
    nextSteps: { label: "Next steps", multiline: true },
    directionsLabel: { label: "Directions label" },
    helpText: { label: "Help text", multiline: true },
  },
};

function cloneContent(content: EditableContent): EditableContent {
  return screenOrder.reduce((result, screen) => {
    result[screen] = { ...content[screen] };
    return result;
  }, {} as EditableContent);
}

function normalizeContent(value: unknown): EditableContent {
  const incoming =
    typeof value === "object" && value !== null
      ? (value as Partial<Record<ScreenId, Record<string, unknown>>>)
      : {};

  return screenOrder.reduce((result, screen) => {
    const incomingScreen = incoming[screen];
    const safeIncoming =
      typeof incomingScreen === "object" && incomingScreen !== null
        ? Object.entries(incomingScreen).reduce((fields, [key, fieldValue]) => {
            fields[key] = typeof fieldValue === "string" ? fieldValue : String(fieldValue ?? "");
            return fields;
          }, {} as ScreenContent)
        : {};
    result[screen] = { ...defaultContent[screen], ...safeIncoming };
    return result;
  }, {} as EditableContent);
}

function labelForField(screen: ScreenId, key: string) {
  const known = fieldCopy[screen]?.[key];
  if (known) return known;
  return {
    label: key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    multiline: key.toLowerCase().includes("text") || key.toLowerCase().includes("body"),
  };
}

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { error?: unknown } }).data;
    if (typeof data?.error === "string") return data.error;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function ScreenIcon({ screen }: { screen: ScreenId }) {
  if (screen === "welcome" || screen === "complete") return <LayoutPanelTop size={17} />;
  if (screen === "checking") return <RefreshCw size={17} />;
  if (screen === "consent") return <ShieldCheck size={17} />;
  return <FileText size={17} />;
}

export default function ContentEditor() {
  const { data, isLoading, isError, error, refetch } = useGetKioskContent();
  const updateMutation = useUpdateKioskContent();
  const resetMutation = useResetKioskContent();
  const [activeScreen, setActiveScreen] = useState<ScreenId>("welcome");
  const [draft, setDraft] = useState<EditableContent>(() => cloneContent(defaultContent));
  const [savedSnapshot, setSavedSnapshot] = useState<EditableContent>(() =>
    cloneContent(defaultContent),
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmReset, setConfirmReset] = useState<"screen" | "all" | null>(null);
  const initialized = useRef(false);
  const saveAllRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    document.title = "Kiosk content editor · IU Student Health Center";
  }, []);

  useEffect(() => {
    if (initialized.current || isLoading) return;
    const next = normalizeContent(data);
    initialized.current = true;
    setDraft(next);
    setSavedSnapshot(cloneContent(next));
  }, [data, isLoading]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedSnapshot),
    [draft, savedSnapshot],
  );
  const currentFields = draft[activeScreen];
  const activeDetails = screenDetails[activeScreen];
  const isSaving = updateMutation.isPending;
  const isResetting = resetMutation.isPending;

  const updateField = (key: string, value: string) => {
    setDraft((current) => ({
      ...current,
      [activeScreen]: { ...current[activeScreen], [key]: value },
    }));
    setNotice(null);
  };

  const saveAll = () => {
    if (isSaving || !dirty) {
      if (!dirty) setNotice({ tone: "info", text: "Everything is already saved." });
      return;
    }
    const submitted = cloneContent(draft);
    setNotice({ tone: "info", text: "Saving kiosk content…" });
    updateMutation.mutate(
      { data: { content: submitted as unknown as KioskContent } },
      {
        onSuccess: () => {
          setSavedSnapshot(cloneContent(submitted));
          setNotice({ tone: "success", text: "All kiosk content saved." });
        },
        onError: (saveError: unknown) => {
          setNotice({
            tone: "error",
            text: errorMessage(saveError, "We couldn’t save the kiosk content. Try again."),
          });
        },
      },
    );
  };

  const saveCurrent = () => {
    if (isSaving) return;
    const submitted = cloneContent(draft);
    setNotice({ tone: "info", text: `Saving ${activeDetails.label.toLowerCase()} screen…` });
    updateMutation.mutate(
      { data: { content: submitted as unknown as KioskContent } },
      {
        onSuccess: () => {
          setSavedSnapshot(cloneContent(submitted));
          setNotice({ tone: "success", text: `${activeDetails.label} screen saved.` });
        },
        onError: (saveError: unknown) => {
          setNotice({
            tone: "error",
            text: errorMessage(saveError, "We couldn’t save this screen. Try again."),
          });
        },
      },
    );
  };

  const resetContent = () => {
    if (isResetting) return;
    const resetTarget = confirmReset;
    setConfirmReset(null);
    setNotice({ tone: "info", text: "Restoring the original default content…" });
    resetMutation.mutate(
      resetTarget === "screen" ? { data: { screen: activeScreen } } : {},
      {
        onSuccess: () => {
          void refetch().then((result) => {
            const next = normalizeContent(result.data);
            setDraft(next);
            setSavedSnapshot(cloneContent(next));
            setNotice({
              tone: "success",
              text:
                resetTarget === "screen"
                  ? `${activeDetails.label} screen reset to its original defaults.`
                  : "All screens reset to the original defaults.",
            });
          });
        },
        onError: (resetError: unknown) => {
          setNotice({
            tone: "error",
            text: errorMessage(resetError, "We couldn’t reset the content. Try again."),
          });
        },
      },
    );
  };

  saveAllRef.current = saveAll;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveAllRef.current();
      }
      if (event.key === "Escape") setConfirmReset(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-[100dvh] bg-[#fbf5e8] px-5 py-6 text-[#3d2626] sm:px-8">
        <div className="mx-auto max-w-[1380px] animate-pulse">
          <div className="h-12 w-64 rounded-xl bg-[#eadfce]" />
          <div className="mt-10 grid gap-6 lg:grid-cols-[260px_1fr]">
            <div className="h-[560px] rounded-[28px] bg-[#f0e6d7]" />
            <div className="h-[560px] rounded-[28px] bg-[#f0e6d7]" />
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf5e8] px-5 py-8 text-[#3d2626]">
        <section className="w-full max-w-md rounded-[28px] border border-[#e4cfc0] bg-[#fffaf1] p-7 text-center shadow-[0_18px_50px_rgba(93,44,32,.1)] sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ec] text-[#a2312b]">
            <AlertCircle size={25} />
          </div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[.16em] text-[#9a8074]">
            Content unavailable
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-.04em] text-[#990000]">
            We couldn’t load the editor.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#806960]">
            {errorMessage(error, "The kiosk content service is unavailable right now.")}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#990000] px-5 text-sm font-bold text-[#fff9ed] transition hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
          >
            <RefreshCw size={17} /> Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="kiosk-shell min-h-[100dvh] bg-[#fbf5e8] text-[#3d2626]">
      <header className="border-b border-[#e7d9c7] bg-[#fffaf1]/90 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[76px] max-w-[1380px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#990000] shadow-[0_8px_18px_rgba(153,0,0,.15)]">
              <img
                src="/iu-trident-reverse-cropped.png"
                alt="Indiana University trident"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-[-.02em] text-[#990000] sm:text-[17px]">
                IU Student Health Center
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[.15em] text-[#9a8074]">
                Staff tools / kiosk content
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div
              className={`hidden items-center gap-2 text-xs font-bold sm:flex ${
                dirty ? "text-[#9a5147]" : "text-[#52705a]"
              }`}
              aria-live="polite"
            >
              <span
                className={`h-2 w-2 rounded-full ${dirty ? "bg-[#bd6e4d]" : "bg-[#5c8b68]"}`}
                aria-hidden="true"
              />
              {dirty ? "Unsaved changes" : "All changes saved"}
            </div>
            <button
              type="button"
              onClick={saveAll}
              disabled={isSaving || !dirty}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#990000] px-3.5 text-sm font-bold text-[#fff9ed] shadow-[0_7px_15px_rgba(153,0,0,.14)] transition hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20 disabled:cursor-not-allowed disabled:opacity-45 sm:px-4"
            >
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="hidden sm:inline">Save all content</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] px-5 pb-12 pt-6 sm:px-8 sm:pt-8 lg:px-10">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#9a8074]">
              Content editor
            </p>
            <h1 className="mt-2 font-serif text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[.98] tracking-[-.055em] text-[#990000]">
              Shape the check-in experience.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#806960]">
              Update the words students see on the kiosk. Changes are content-only and never
              include student check-in answers.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#e3d4c3] bg-[#fffaf1] px-3.5 py-2 text-[11px] font-bold text-[#806960] md:flex">
            <LockKeyhole size={14} className="text-[#990000]" />
            Staff-only editor
          </div>
        </div>

        {notice && (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              notice.tone === "success"
                ? "border-[#c7ddc9] bg-[#edf7ee] text-[#3f6e4a]"
                : notice.tone === "error"
                  ? "border-[#e8b9ad] bg-[#fff0ec] text-[#9a2929]"
                  : "border-[#e4d6bc] bg-[#fff6df] text-[#80613a]"
            }`}
          >
            {notice.tone === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : notice.tone === "error" ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <Info size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{notice.text}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice(null)}
              className="ml-auto shrink-0 rounded-md p-0.5 opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#990000]/25"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="rounded-[26px] border border-[#e4d6c7] bg-[#f7eee3] p-3 lg:sticky lg:top-5">
            <div className="flex items-center justify-between px-3 pb-3 pt-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9a8074]">
                  Kiosk flow
                </p>
                <p className="mt-1 text-sm font-bold text-[#632f2f]">8 editable screens</p>
              </div>
              <Menu size={17} className="text-[#b18e7f] lg:hidden" />
            </div>
            <nav aria-label="Kiosk screens" className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
              {screenOrder.map((screen) => {
                const selected = activeScreen === screen;
                return (
                  <button
                    key={screen}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => {
                      setActiveScreen(screen);
                      setNotice(null);
                    }}
                    className={`group flex min-h-[58px] items-center gap-3 rounded-2xl px-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#990000]/25 ${
                      selected
                        ? "bg-[#fffaf1] text-[#990000] shadow-[0_7px_18px_rgba(93,44,32,.07)]"
                        : "text-[#806960] hover:bg-[#f3e5d7] hover:text-[#632f2f]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        selected ? "bg-[#990000] text-[#fff9ed]" : "bg-[#eadbca] text-[#9a8074]"
                      }`}
                    >
                      <ScreenIcon screen={screen} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{screenDetails[screen].label}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[.08em] opacity-65">
                        {screenDetails[screen].number}
                      </span>
                    </span>
                    <ChevronRight
                      size={15}
                      className={`shrink-0 transition-transform ${selected ? "translate-x-0.5 opacity-100" : "opacity-0 group-hover:opacity-60"}`}
                    />
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-[#e5d5c5] px-3 pt-4">
              <p className="flex items-start gap-2 text-[11px] leading-5 text-[#907568]">
                <CircleHelp size={15} className="mt-0.5 shrink-0 text-[#990000]" />
                Text changes appear on the kiosk after they are saved.
              </p>
            </div>
          </aside>

          <section className="min-w-0 rounded-[28px] border border-[#e4d6c7] bg-[#fffaf1] shadow-[0_16px_40px_rgba(93,44,32,.07)]">
            <div className="border-b border-[#eee1d2] px-5 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#9a8074]">
                    {activeDetails.eyebrow}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-.05em] text-[#632f2f] sm:text-4xl">
                    {activeDetails.label}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#806960]">
                    {activeDetails.description}
                  </p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setConfirmReset("screen")}
                    disabled={isResetting || isSaving}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dfcdbd] px-3 text-xs font-bold text-[#806960] transition hover:border-[#bd9d8c] hover:bg-[#f8ede0] focus:outline-none focus:ring-2 focus:ring-[#990000]/25 disabled:opacity-45 sm:flex-none"
                  >
                    <RotateCcw size={15} /> Reset screen
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrent}
                    disabled={isSaving}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#632f2f] px-3 text-xs font-bold text-[#fff9ed] transition hover:bg-[#4c2222] focus:outline-none focus:ring-4 focus:ring-[#632f2f]/20 disabled:opacity-45 sm:flex-none"
                  >
                    <Save size={15} /> Save screen
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-7 px-5 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1fr)_245px]">
              <div className="space-y-5">
                {Object.entries(currentFields).map(([key, value]) => {
                  const copy = labelForField(activeScreen, key);
                  const fieldId = `content-${activeScreen}-${key}`;
                  return (
                    <div key={key}>
                      <label htmlFor={fieldId} className="block text-sm font-bold text-[#632f2f]">
                        {copy.label}
                      </label>
                      {copy.hint && (
                        <p className="mt-1 text-xs leading-5 text-[#9a8074]">{copy.hint}</p>
                      )}
                      {copy.multiline ? (
                        <textarea
                          id={fieldId}
                          value={value}
                          onChange={(event) => updateField(key, event.target.value)}
                          rows={4}
                          className="mt-2 block min-h-[108px] w-full resize-y rounded-2xl border border-[#dfcdbd] bg-[#fffcf5] px-4 py-3 text-sm leading-6 text-[#3d2626] outline-none transition placeholder:text-[#b59c8c] focus:border-[#990000] focus:ring-4 focus:ring-[#990000]/10"
                        />
                      ) : (
                        <input
                          id={fieldId}
                          type="text"
                          value={value}
                          onChange={(event) => updateField(key, event.target.value)}
                          className="mt-2 block min-h-12 w-full rounded-2xl border border-[#dfcdbd] bg-[#fffcf5] px-4 text-sm text-[#3d2626] outline-none transition placeholder:text-[#b59c8c] focus:border-[#990000] focus:ring-4 focus:ring-[#990000]/10"
                        />
                      )}
                    </div>
                  );
                })}
                {Object.keys(currentFields).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#dec9b8] bg-[#fffaf1] px-5 py-8 text-center">
                    <p className="text-sm font-bold text-[#632f2f]">No editable fields on this screen.</p>
                    <p className="mt-1 text-xs text-[#907568]">
                      The content service returned an empty screen.
                    </p>
                  </div>
                )}
              </div>

              <aside className="rounded-2xl border border-[#eadccc] bg-[#f8efe4] p-4 sm:p-5">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#990000]">
                  <Info size={14} /> Editing guide
                </p>
                <h3 className="mt-3 font-serif text-xl font-semibold tracking-[-.03em] text-[#632f2f]">
                  Keep it clear.
                </h3>
                <ul className="mt-4 space-y-3 text-xs leading-5 text-[#806960]">
                  <li className="flex gap-2.5">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#990000]" />
                    Use short, direct sentences students can scan from a standing kiosk.
                  </li>
                  <li className="flex gap-2.5">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#990000]" />
                    Keep button labels action-oriented and specific.
                  </li>
                  <li className="flex gap-2.5">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#990000]" />
                    Never add student names, answers, or other check-in data here.
                  </li>
                </ul>
                <div className="mt-5 border-t border-[#e6d5c4] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#9a8074]">
                    Keyboard shortcut
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#806960]">
                    Press <kbd className="rounded-md border border-[#d9c5b4] bg-[#fffaf1] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#632f2f]">⌘ / Ctrl + S</kbd> to save all screens.
                  </p>
                </div>
              </aside>
            </div>

            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#eee1d2] px-5 py-5 sm:flex-row sm:items-center sm:px-8">
              <button
                type="button"
                onClick={() => setConfirmReset("all")}
                disabled={isResetting || isSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-[#9a5147] transition hover:bg-[#fff0ec] focus:outline-none focus:ring-2 focus:ring-[#990000]/25 disabled:opacity-45 sm:justify-start"
              >
                <RotateCcw size={15} /> Reset all content
              </button>
              <div className="flex items-center justify-end gap-3">
                <span className={`text-xs font-semibold ${dirty ? "text-[#9a5147]" : "text-[#6d896f]"}`}>
                  {dirty ? "You have unsaved edits" : "Saved to the kiosk"}
                </span>
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={isSaving || !dirty}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#990000] px-4 text-xs font-bold text-[#fff9ed] transition hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                  Save all
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {confirmReset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d2626]/35 p-5 backdrop-blur-sm"
          role="presentation"
          onClick={() => setConfirmReset(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[26px] border border-[#e4d6c7] bg-[#fffaf1] p-6 shadow-[0_28px_80px_rgba(61,38,38,.24)] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9a8074]">
                  Restore original defaults
                </p>
                <h2 id="reset-dialog-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-.04em] text-[#990000]">
                  {confirmReset === "screen"
                    ? `Reset the ${activeDetails.label.toLowerCase()} screen?`
                    : "Reset every screen?"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close reset confirmation"
                onClick={() => setConfirmReset(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e2d2bf] text-[#806259] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#806960]">
              {confirmReset === "screen"
                 ? "This removes saved and unsaved edits on the current screen and restores the original defaults."
                 : "This removes saved and unsaved edits across the editor and restores the original defaults for every screen."}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmReset(null)}
                className="min-h-11 rounded-xl px-4 text-sm font-bold text-[#806960] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-2 focus:ring-[#990000]/25"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={resetContent}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#990000] px-4 text-sm font-bold text-[#fff9ed] transition hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
              >
                <RotateCcw size={16} /> Reset {confirmReset === "screen" ? "screen" : "all"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}