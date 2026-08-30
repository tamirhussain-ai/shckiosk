import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  CreditCard,
  FileCheck2,
  Globe2,
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
  useCompleteCheckIn,
  useHealthCheck,
  useGetKioskContent,
} from "@workspace/api-client-react";
import type { CheckInSession, CompletionResult, CheckInIdentificationMethod } from "@workspace/api-client-react";
import { kioskContentDefaults } from "@/lib/kiosk-content-defaults";
import { SignaturePad, type SignaturePadRef } from "./SignaturePad";

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

const generalConsentDescription = `IU STUDENT HEALTH CENTER GENERAL CONSENT FORM, GUARANTEE OF PAYMENT AND ACKNOWLEGEMENT OF NOTICE

Treatment Authorization
I authorize IU Bloomington Student Health Center (IUSHC), its agents and employees to furnish medical care and services, including but not limited to, diagnostic tests, examinations, digital photos for treatment and documentation, and other medical and/or surgical procedures, which are deemed necessary during my care. I agree that IUSHC cannot make any explicit guarantee or promises regarding results or cures.

Teaching Environment
I understand that IUSHC is part of a teaching environment and at times I may be asked to allow students, residents, and fellows to be involved in my care and that my medical records, including digital photos, may be used for purposes of research and education, so long as all personal identifiers are removed.

Infectious Disease Testing
I agree to allow IUSHC to test for infectious diseases including hepatitis and human immunodeficiency virus (HIV) if one of my caregivers is exposed to my blood or body fluid. In reciprocity, if I am exposed to any blood or body fluid during my treatment, I can request the source person be tested for such infectious diseases in accordance with Universal Protocol; at no cost to parties being tested. All parties invoiced will have access to the results.

Financial Agreement
In consideration for providing medical care and services, I understand that I am financially responsible for all fees and charges for services provided by IUSHC. IUSHC will provide information regarding fees for services upon request.

Payment Responsibility and Insurance Benefit Authorization
I am responsible for paying for all the care I receive, and if insurance does not cover all the cost, I must pay the remaining balance. I agree IUSHC may release my medical records as necessary to determine my insurance benefits and receive all payments that I am entitled to under insurance policies. I authorize payment of insurance benefits be made on my behalf to IUSHC for services provided to me. I understand that I am responsible for knowing what insurance coverage I have, providing IUSHC with my current insurance information, and for following all insurance policy rules.

Bursar Account (if active)
I authorize IUSHC to place my health service charges onto my Bursar account. By signing this form, I understand that I am entering into and agreeing to a legally binding contract to pay all fees assessed to my bursar account. I understand that if I allow my bursar account to become delinquent, University services, such as future registration, transcripts, diploma, and other certification will be encumbered until such time as the account is paid in full. In addition, I understand that IU may refer my past due account for collection, report my delinquency to the credit bureau system and may authorize legal action against me for the collection of this debt. I agree to be liable for all reasonable collection costs, including attorney fees, collection agency fees and court costs necessary for the collection of any past due amount. I understand and agree that if I leave any IU campus with an unpaid balance, that I authorize the University and/or its agents, including attorneys and collection agencies to contact me via cellular telephone and/or all forms of electronic technology (including text messaging/email) to collect such outstanding debt, unless I notify the agent in writing to cease electronic/cellular communication.

Referrals
I understand that IUSHC or my provider may refer me to an out of network provider for health care items or services. An out of network provider is not bound by payment provisions that apply to health care items or services rendered by a network provider under my health plan. I may contact my health plan before receiving health care items or services rendered by an out of network provider to obtain a list of network providers that may render the health care items or services and for additional assistance.

HIPAA Notice of Privacy Practices
I acknowledge that IUSHC is required to provide me with a copy of their Notice of Privacy Practices, which states how IUSHC may use and/or disclose my health information. I acknowledge that I have received or have been offered a copy of IUSHC's Notice of Privacy Practices (available electronically at https://healthcenter.indiana.edu/about/policies/privacy-notice.html) and that I may request a paper copy of this notice should I so choose.

Communication Authorization
I understand that IUSHC can contact me by telephone but needs my written permission to use other types of communication, including text message and email. I understand that IUSHC has enabled a portal for my use to securely perform the following: view lab results, vaccination information, make appointments, and communicate via email. An email is sent to me upon activation of the portal. Email sent through the University’s email system is secure, but the portal has additional security measures.

IUSHC requests my permission to contact me by text message and through my University email address with information regarding my health care. I understand that the security of email sent from outside the University system or by text messages are not secure and there is a risk that the messages could be intercepted and read by someone other than myself.

I authorize IUSHC to contact me by:

Text message
Email

Duration of Consent
This consent form will be valid for one (1) year from the date of signature below. I may revoke my consent at any time, except to the extent that action has been taken in reliance on the consent. Any revocation of my consent must be done in writing delivered to IUSHC.

Acknowledgement
I have read the above and have had the opportunity to ask questions. I understand my rights and obligations as described in this consent form.`;

const journeySteps = [
  { id: "demographics", label: "Contact" },
  { id: "appointment", label: "Visit" },
  { id: "coverage", label: "Coverage" },
  { id: "consent", label: "Consent" },
  { id: "questionnaire", label: "Questions" },
];

const hasUnsignedConsentForms = (checkInSession: CheckInSession | null) =>
  checkInSession?.consentForms?.some((form) => form.status === "unsigned") ??
  false;

const hasEncounterQuestionnaires = (checkInSession: CheckInSession | null) =>
  (checkInSession?.questionnaires?.length ?? 0) > 0;

const previewScreenOptions: { id: Screen; label: string }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "appointment", label: "Appointment" },
  { id: "demographics", label: "Details" },
  { id: "coverage", label: "Coverage" },
  { id: "consent", label: "Consent" },
  { id: "questionnaire", label: "Questions" },
  { id: "checking", label: "Checking" },
  { id: "complete", label: "Complete" },
];

const previewScreenIds = new Set<Screen>(previewScreenOptions.map((option) => option.id));

const previewSession: CheckInSession = {
  sessionId: "preview-session",
  requiresVerification: false,
  student: {
    firstName: "Alex",
    lastName: "Hoosier",
    universityId: "iu123456",
    dateOfBirth: "10/14/2003",
    phone: "812-555-0199",
    email: "alex.hoosier@example.edu",
    addressLine1: "107 S Indiana Avenue",
    addressLine2: "Room 204",
    city: "Bloomington",
    state: "IN",
    zip: "47405",
  },
  appointments: [
    {
      id: "preview-appointment",
      date: "Today",
      time: "10:30 AM",
      provider: "Dr. Alvarez",
      type: "Follow-up visit",
      location: "IU Student Health Center",
      addressLine2: "600 N Eagleson Avenue",
    },
  ],
  insuranceInformation: {
    insuranceCarrier: "IU Student Insurance",
    memberId: "IU-123456",
    groupNumber: "IU-HEALTH",
    subscriberName: "Alex Hoosier",
  },
  onFileInsuranceInformation: {
    insuranceCarrier: "IU Student Insurance",
    memberId: "IU-123456",
    groupNumber: "IU-HEALTH",
    subscriberName: "Alex Hoosier",
  },
  schedulingHandoff: {
    mode: "qr-link",
    available: false,
    label: "Schedule online",
    message: "Use the self-service scheduler QR code or ask the front desk for help.",
  },
  consentForms: [
    {
      id: "c1",
      title: "General Consent Form",
      description: generalConsentDescription,
      requiresSignature: true,
      status: "unsigned"
    },
    {
      id: "c2",
      title: "Release of Information",
      description: "I authorize the IU Student Health Center to release my medical records to the parties indicated in this form.",
      requiresSignature: true,
      status: "unsigned"
    }
  ],
  questionnaires: [
    {
      id: "q1",
      name: "Reason for Visit",
      status: "not_started",
      questions: [
        { id: "rv1", text: "How are you feeling today?", type: "single_select", mandatory: true, options: [{id: "good", label: "Good"}, {id: "okay", label: "Okay"}, {id: "not_well", label: "Not well"}] },
        { id: "rv2", text: "Do you have any new or worsened symptoms?", type: "free_text", mandatory: false }
      ]
    },
    {
      id: "q2",
      name: "PHQ-9 Depression Screening",
      status: "completed_portal",
      completedAnswers: {
        "phq1": "not_at_all",
        "phq2": "several_days"
      },
      questions: [
        { id: "phq1", text: "Little interest or pleasure in doing things", type: "single_select", mandatory: true, options: [{id: "not_at_all", label: "Not at all"}, {id: "several_days", label: "Several days"}] },
        { id: "phq2", text: "Feeling down, depressed, or hopeless", type: "single_select", mandatory: true, options: [{id: "not_at_all", label: "Not at all"}, {id: "several_days", label: "Several days"}] }
      ]
    }
  ]
};

const previewCompletion: CompletionResult = {
  completed: true,
  nextStep: "waiting",
  directions: "Head to the Waiting Area on the first floor.",
  provider: "Dr. Alvarez",
  visitType: "Follow-up visit",
  appointmentTime: "10:30 AM",
  addressLine2: "600 N Eagleson Avenue",
  floorLabel: "First floor",
  waitingArea: "Waiting Area",
  kioskFloor: "Second floor",
  isCurrentFloor: false,
};

function getPreviewScreen(): Screen {
  if (typeof window === "undefined") return "welcome";
  const requested = new URLSearchParams(window.location.search).get("screen");
  return requested && previewScreenIds.has(requested as Screen) ? (requested as Screen) : "welcome";
}

function isPreviewMode() {
  if (typeof window === "undefined") return false;
  const value = new URLSearchParams(window.location.search).get("preview");
  return value === "1" || value === "true";
}

function formatDateOfBirth(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function CheckInFlow() {
  const previewMode = isPreviewMode();
  const initialScreen = previewMode ? getPreviewScreen() : "welcome";
  const [mode, setMode] = useState<CheckInMode>("universityId");
  const [screen, setScreen] = useState<Screen>(initialScreen);
  
  // API State
  const [session, setSession] = useState<CheckInSession | null>(previewMode ? previewSession : null);
  const [completion, setCompletion] = useState<CompletionResult | null>(
    previewMode && initialScreen === "complete" ? previewCompletion : null,
  );

  // Form State
  const [value, setValue] = useState("");
  const [dob, setDob] = useState("");
  const [language, setLanguage] = useState(languages[0]);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTopic, setHelpTopic] = useState<"general" | "language">("general");
  const [error, setError] = useState("");
  
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [coverage, setCoverage] = useState<Coverage>("iu");
  const [insuranceCarrier, setInsuranceCarrier] = useState("");
  const [memberId, setMemberId] = useState("");
  const [groupNumber, setGroupNumber] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [showInsuranceInfo, setShowInsuranceInfo] = useState(false);
  const [showSchedulingHandoff, setShowSchedulingHandoff] = useState(false);
  const [frontDeskSelected, setFrontDeskSelected] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const finalizationStartedRef = useRef(false);
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState<string | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});

  const selectPreviewScreen = (nextScreen: Screen) => {
    if (!previewMode) return;
    setScreen(nextScreen);
    setCompletion(nextScreen === "complete" ? previewCompletion : null);
    setShowInsuranceInfo(false);
    setShowSchedulingHandoff(false);
    setError("");
    const params = new URLSearchParams(window.location.search);
    params.set("preview", "1");
    params.set("screen", nextScreen);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  };
  
  // Sync demographics from session when fetched
  useEffect(() => {
    if (session?.student) {
      setPhone(session.student.phone || "");
      setAddressLine1(session.student.addressLine1 || "");
      setAddressLine2(session.student.addressLine2 || "");
      setCity(session.student.city || "");
      setState(session.student.state || "");
      setZip(session.student.zip || "");
    }
    if (session?.insuranceInformation) {
      setInsuranceCarrier(session.insuranceInformation.insuranceCarrier || "");
      setMemberId(session.insuranceInformation.memberId || "");
      setGroupNumber(session.insuranceInformation.groupNumber || "");
      setSubscriberName(session.insuranceInformation.subscriberName || "");
    }
  }, [session]);

  // API Hooks
  const { data: healthStatus } = useHealthCheck();
  const { data: savedKioskContent } = useGetKioskContent({
    query: { queryKey: ["/api/kiosk/content"], staleTime: 0 },
  });
  const content = savedKioskContent ?? kioskContentDefaults;
  const completionFloorLabel = completion?.floorLabel || content.complete.destinationFallback;
  const completionFloorWords = completionFloorLabel.trim().split(/\s+/);
  const completionFloorPrimary =
    completionFloorWords.length > 1
      ? completionFloorWords.slice(0, -1).join(" ")
      : completionFloorLabel;
  const completionFloorAccent =
    completionFloorWords.length > 1
      ? completionFloorWords[completionFloorWords.length - 1]
      : "";
  const identifyMutation = useIdentifyCheckIn();
  const saveAppointmentMutation = useSaveCheckInAppointment();
  const saveDemographicsMutation = useSaveCheckInDemographics();
  const saveCoverageMutation = useSaveCheckInCoverage();
  const saveConsentMutation = useSaveCheckInConsent();
  const saveQuestionnaireMutation = useSaveCheckInQuestionnaire();
  const completeMutation = useCompleteCheckIn();

  const isMutating = 
    identifyMutation.isPending || 
    saveAppointmentMutation.isPending ||
    saveDemographicsMutation.isPending ||
    saveCoverageMutation.isPending ||
    saveConsentMutation.isPending ||
    saveQuestionnaireMutation.isPending ||
    completeMutation.isPending;

  const visibleJourneySteps = journeySteps.filter(
    (step) =>
      (step.id !== "consent" || hasUnsignedConsentForms(session)) &&
      (step.id !== "questionnaire" || hasEncounterQuestionnaires(session)),
  );
  const isLongFormStage = screen === "consent" || screen === "questionnaire";
  const activeStepIndex = visibleJourneySteps.findIndex((step) => step.id === screen);
  const isJourney = activeStepIndex >= 0;
  const canContinue =
    mode === "qr"
      ? true
      : mode === "universityId"
        ? value.trim().length >= 3 && dob.length === 10
        : value.trim().length >= 2 && dob.length === 10;

  const clearError = () => setError("");

  const finalizeCheckIn = (
    currentSession: CheckInSession,
    fallbackScreen: "coverage" | "consent" | "questionnaire",
  ) => {
    if (finalizationStartedRef.current) return;
    finalizationStartedRef.current = true;
    clearError();

    if (previewMode) {
      setCompletion(previewCompletion);
      setScreen("complete");
      return;
    }

    setScreen("checking");
    completeMutation.mutate(
      { sessionId: currentSession.sessionId },
      {
        onSuccess: (res) => {
          setCompletion(res);
          setScreen("complete");
        },
        onError: () => {
          finalizationStartedRef.current = false;
          setScreen(fallbackScreen);
          setError("Failed to finalize check-in. Please try again.");
        },
      },
    );
  };

  const advanceAfterCoverage = (currentSession: CheckInSession) => {
    if (hasUnsignedConsentForms(currentSession)) {
      setScreen("consent");
    } else if (hasEncounterQuestionnaires(currentSession)) {
      setScreen("questionnaire");
    } else {
      finalizeCheckIn(currentSession, "coverage");
    }
  };

  const advanceAfterConsent = (currentSession: CheckInSession) => {
    if (hasEncounterQuestionnaires(currentSession)) {
      setScreen("questionnaire");
    } else {
      finalizeCheckIn(currentSession, "consent");
    }
  };

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

    if (previewMode) {
      finalizationStartedRef.current = false;
      setSession(previewSession);
      setSelectedAppointment(previewSession.appointments[0]?.id ?? "");
      setScreen("demographics");
      return;
    }
    
    identifyMutation.mutate({
      data: {
        method: mode as CheckInIdentificationMethod,
        value: mode !== "qr" ? value : undefined,
        dateOfBirth: mode !== "qr" ? dob : undefined,
        qrToken: mode === "qr" ? "demo-qr-token" : undefined
      }
    }, {
      onSuccess: (data) => {
        finalizationStartedRef.current = false;
        setSession(data);
        setSelectedAppointment(data.appointments?.[0]?.id ?? "");
        setShowSchedulingHandoff(false);
        setFrontDeskSelected(false);
        setScreen("demographics");
      },
      onError: (err: unknown) => {
        setError(getApiErrorMessage(err, "We couldn't find a matching demo visit. Use the sample details shown on this screen."));
      }
    });
  };

  const goBack = () => {
    clearError();
    if (screen === "appointment" && showSchedulingHandoff) {
      setShowSchedulingHandoff(false);
      return;
    }
    if (screen === "coverage" && showInsuranceInfo) {
      setShowInsuranceInfo(false);
      return;
    }
    if (screen === "questionnaire" && activeQuestionnaireId) {
      setActiveQuestionnaireId(null);
      return;
    }
    const previous: Partial<Record<Screen, Screen>> = {
      appointment: "demographics",
      demographics: "welcome",
      coverage: "appointment",
      consent: "coverage",
    };
    let next = previous[screen];

    if (screen === "questionnaire") {
      next = hasUnsignedConsentForms(session) ? "consent" : "coverage";
    } else if (screen === "checking") {
      next = hasEncounterQuestionnaires(session)
        ? "questionnaire"
        : hasUnsignedConsentForms(session)
          ? "consent"
          : "coverage";
    }

    if (next) setScreen(next);
  };

  const startOver = () => {
    finalizationStartedRef.current = false;
    if (previewMode) {
      setScreen("welcome");
      setSession(previewSession);
      setCompletion(null);
      setSelectedAppointment(previewSession.appointments[0]?.id ?? "");
      setShowInsuranceInfo(false);
      setShowSchedulingHandoff(false);
      setError("");
      setConsentAccepted(false);
      signaturePadRef.current?.clear();
      setActiveQuestionnaireId(null);
      setQuestionnaireAnswers({});
      return;
    }

    setScreen("welcome");
    setSession(null);
    setMode("universityId");
    setValue("");
    setDob("");
    setSelectedAppointment("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setZip("");
    setCoverage("iu");
    setInsuranceCarrier("");
    setMemberId("");
    setGroupNumber("");
    setSubscriberName("");
    setShowInsuranceInfo(false);
    setShowSchedulingHandoff(false);
    setFrontDeskSelected(false);
    setConsentAccepted(false);
    signaturePadRef.current?.clear();
    setActiveQuestionnaireId(null);
    setQuestionnaireAnswers({});
    clearError();
    setShowHelp(false);
    setLanguageOpen(false);
    setCompletion(null);
  };

  const continueAppointment = () => {
    if (!selectedAppointment || !session?.sessionId) {
      setError("Select the appointment you’re checking in for.");
      return;
    }
    clearError();

    if (previewMode) {
      setScreen("coverage");
      return;
    }

    saveAppointmentMutation.mutate({
      sessionId: session.sessionId,
      data: { appointmentId: selectedAppointment }
    }, {
      onSuccess: (data) => {
        finalizationStartedRef.current = false;
        setSession(data);
        setConsentAccepted(false);
        signaturePadRef.current?.clear();
        setActiveQuestionnaireId(null);
        setQuestionnaireAnswers({});
        setScreen("coverage");
      },
      onError: () => setError("Failed to save appointment. Please try again.")
    });
  };

  const continueDemographics = () => {
    if (
      !addressLine1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !zip.trim() ||
      !phone.trim()
    ) {
      setError("Please complete your address, ZIP, and mobile phone.");
      return;
    }
    if (!session?.sessionId) return;
    clearError();

    if (previewMode) {
      setScreen("appointment");
      return;
    }

    saveDemographicsMutation.mutate({
      sessionId: session.sessionId,
      data: { addressLine1, addressLine2, city, state, zip, phone }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setScreen("appointment");
      },
      onError: () => setError("Failed to save details. Please try again.")
    });
  };

  // Consent logic
  const unsignedConsents = session?.consentForms?.filter(f => f.status === "unsigned") || [];
  const currentConsent = unsignedConsents[0];
  const totalConsents = session?.consentForms?.length || 0;
  const completedConsentsCount = totalConsents - unsignedConsents.length;
  const currentConsentIndex = completedConsentsCount + 1;

  const continueConsent = () => {
    if (!consentAccepted || signaturePadRef.current?.isEmpty() !== false) {
      setError("Please review the consent and add your signature to continue.");
      return;
    }
    if (!session?.sessionId || !currentConsent) return;
    clearError();

    const signatureData = signaturePadRef.current?.getDataUrl() || "";

    if (previewMode) {
      const updatedConsentForms = session.consentForms?.map(f => 
        f.id === currentConsent.id ? { ...f, status: "signed" as const } : f
      ) || [];
      
      const nextSession = { ...session, consentForms: updatedConsentForms };
      setSession(nextSession);
      
      setConsentAccepted(false);
      signaturePadRef.current?.clear();

      if (!hasUnsignedConsentForms(nextSession)) {
        advanceAfterConsent(nextSession);
      }
      return;
    }

    saveConsentMutation.mutate({
      sessionId: session.sessionId,
      data: { accepted: consentAccepted, formId: currentConsent.id, signatureData }
    }, {
      onSuccess: (data) => {
        setSession(data);
        setConsentAccepted(false);
        signaturePadRef.current?.clear();
        
        if (!hasUnsignedConsentForms(data)) {
          advanceAfterConsent(data);
        }
      },
      onError: () => setError("Failed to save consent. Please try again.")
    });
  };

  // Recover safely if an unavailable encounter stage is reached from stale UI state.
  useEffect(() => {
    if (!session) return;
    if (screen === "consent" && !hasUnsignedConsentForms(session)) {
      advanceAfterConsent(session);
    } else if (
      screen === "questionnaire" &&
      !hasEncounterQuestionnaires(session)
    ) {
      if (hasUnsignedConsentForms(session)) {
        setScreen("consent");
      } else {
        finalizeCheckIn(session, "coverage");
      }
    }
  }, [screen, session]);

  const continueQuestions = () => {
    if (session?.questionnaires?.some(q => q.status === "not_started")) {
      setError("Please complete all required questionnaires.");
      return;
    }
    if (!session?.sessionId) return;
    finalizeCheckIn(session, "questionnaire");
  };

  const continueCoverage = () => {
    if (!session?.sessionId) return;
    if (
      coverage === "other" &&
      (!insuranceCarrier.trim() || !memberId.trim() || !subscriberName.trim())
    ) {
      setError("Add the insurance carrier, member ID, and subscriber name.");
      return;
    }
    clearError();

    if (previewMode) {
      advanceAfterCoverage(session);
      return;
    }

    saveCoverageMutation.mutate({
      sessionId: session.sessionId,
      data: {
        coverage,
        insuranceCarrier: coverage === "other" ? insuranceCarrier : undefined,
        memberId: coverage === "other" ? memberId : undefined,
        groupNumber: coverage === "other" ? groupNumber : undefined,
        subscriberName: coverage === "other" ? subscriberName : undefined,
      }
    }, {
      onSuccess: (data) => {
        setSession(data);
        advanceAfterCoverage(data);
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
      className="kiosk-back-button mb-6 flex min-h-10 items-center gap-2 text-sm font-bold text-[#806259] transition hover:text-[#990000] focus:outline-none focus:ring-2 focus:ring-[#990000]/25 disabled:opacity-50"
    >
      <ArrowLeft size={17} /> Back
    </button>
  );

  return (
    <main
      className="kiosk-shell relative flex h-[100dvh] flex-col overflow-hidden text-[#3d2626]"
      style={{
        background:
          "radial-gradient(circle at 5% -5%, rgba(245,216,215,.9), transparent 30%), radial-gradient(circle at 100% 100%, rgba(237,222,193,.62), transparent 32%), #fbf5e8",
      }}
    >
      <header className="relative z-20 flex shrink-0 items-center justify-between px-6 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#990000] text-[#fff9ed] shadow-[0_8px_20px_rgba(153,0,0,.16)]">
              <img
                src="/iu-trident-reverse-cropped.png"
                alt="Indiana University trident"
                className="h-9 w-9 object-contain"
              />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-.035em] text-[#990000]">
              IU Student Health Center
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

      <div
        className={`pointer-events-none absolute z-0 -translate-x-1/2 -translate-y-1/2 ${
          screen === "complete" ? "left-1/2 top-[54%]" : "left-[25%] top-[55%]"
        }`}
        aria-hidden="true"
      >
        <img
          src="/iu-trident-crimson-cropped.png"
          alt=""
          className={`w-auto max-w-[82vw] object-contain opacity-[0.05] ${
            screen === "complete"
              ? "h-[min(72vh,730px)]"
              : "h-[min(62vh,580px)] sm:h-[min(72vh,700px)]"
          }`}
        />
      </div>

      {previewMode && (
        <div className="relative z-40 mx-auto w-full shrink-0 max-w-[1370px] px-6 sm:px-10 lg:px-14">
          <div className="rounded-2xl border border-[#e2d2bf] bg-[#fffaf1]/95 p-2.5 shadow-[0_12px_30px_rgba(108,35,35,.08)] backdrop-blur-sm">
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="shrink-0 px-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#9a8074]">
                Screen preview
              </div>
              <div className="h-6 w-px shrink-0 bg-[#e7d9c7]" />
              <div className="flex min-w-max items-center gap-1">
                {previewScreenOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    data-testid={`preview-${option.id}`}
                    aria-current={screen === option.id ? "page" : undefined}
                    onClick={() => selectPreviewScreen(option.id)}
                    className={`min-h-10 rounded-xl px-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#990000]/25 ${
                      screen === option.id
                        ? "bg-[#990000] text-[#fff9ed] shadow-[0_3px_10px_rgba(153,0,0,.14)]"
                        : "text-[#806259] hover:bg-[#f4e6d5] hover:text-[#632f2f]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#9a8074]">
            Preview mode · sample data only · no check-in is submitted
          </p>
        </div>
      )}

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

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1370px] flex-1 flex-col overflow-hidden px-6 pb-9 sm:px-10 lg:px-14 lg:pb-14">
        {isJourney && (
          <nav
            aria-label="Check-in progress"
            className="kiosk-reveal mb-8 flex shrink-0 items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-[#eadccb] bg-[#fffaf1]/70 px-4 py-3.5 lg:mb-10 lg:px-6"
          >
            {visibleJourneySteps.map((step, index) => {
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
                  {index < visibleJourneySteps.length - 1 && (
                    <span className={`mx-1 h-px flex-1 ${isDone ? "bg-[#b8d0bd]" : "bg-[#e6d7c4]"}`} />
                  )}
                </div>
              );
            })}
          </nav>
        )}

        <div
          className={
            screen === "complete"
              ? "grid min-h-0 flex-1 grid-cols-1 overflow-y-auto"
              : `grid min-h-0 flex-1 grid-cols-1 gap-8 overflow-hidden ${
                  isLongFormStage ? "" : "lg:grid-cols-[minmax(0,.82fr)_minmax(540px,1.18fr)] lg:gap-16"
                } ${
                  isJourney ? "lg:items-start" : "lg:items-center"
                }`
          }
        >
          {!isLongFormStage && (
            <section
              className={`kiosk-reveal kiosk-completion-copy relative z-10 flex min-w-0 flex-col justify-center ${
                screen === "complete" ? "kiosk-completion-panel mx-auto w-full items-center" : "lg:min-h-[590px]"
              }`}
            >
            {screen === "welcome" ? (
              <div className="max-w-[610px]">
                <h1
                  className="max-w-[590px] text-[clamp(3.15rem,5.4vw,5.55rem)] font-semibold leading-[.95] tracking-[-.07em] text-[#990000] font-serif"
                >
                  {content.welcome.title}
                  <span className="mt-3 block max-w-[540px] text-[clamp(2.6rem,4.4vw,4.5rem)] leading-[.98] tracking-[-.07em] text-[#bd5b48]">{content.welcome.titleAccent}</span>
                </h1>
                <p className="mt-7 max-w-[480px] text-[17px] leading-7 text-[#806960]">
                  {content.welcome.description}
                </p>
                <div className="mt-10 max-w-[270px]">
                  <div className="flex items-start gap-3 rounded-2xl border border-[#e7d9c7] bg-[#fffaf1]/80 p-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2d9bd] text-[#8b3a3a]">
                      <Clock3 size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#632f2f]">{content.welcome.duration}</p>
                      <p className="mt-1 text-xs leading-5 text-[#9a8074]">{content.welcome.durationNote}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : screen === "complete" ? (
              <div className="kiosk-fade mx-auto flex w-full max-w-[980px] flex-col items-center text-center">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c9ddcd] bg-[#e6f0e5] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#316148]">
                  <CheckCircle2 size={14} />
                  {content.complete.badge}
                </div>
                <p
                  className="mb-4 text-[12px] font-bold uppercase tracking-[.14em] text-[#806960]"
                  data-testid="text-kiosk-floor"
                >
                  {content.complete.kioskFloorPrefix} {completion?.kioskFloor || content.complete.destinationFallback}.
                </p>
                <h1
                   className="kiosk-completion-floor-heading kiosk-completion-floor-pulse max-w-full font-semibold uppercase leading-[.82] tracking-[-.08em] text-[#990000] font-serif"
                  data-testid="text-floor"
                  aria-label={completionFloorLabel}
                >
                  <span className="block">{completionFloorPrimary}</span>
                  {completionFloorAccent ? (
                    <>
                      {" "}
                      <span className="kiosk-completion-floor-accent block">{completionFloorAccent}</span>
                    </>
                  ) : null}
                </h1>
                <p
                  className="kiosk-completion-waiting mt-2 text-[clamp(2.5rem,6vw,5.8rem)] font-semibold leading-none tracking-[-.055em] text-[#bd5b48] font-serif"
                  data-testid="text-waiting-area"
                >
                  {completion?.waitingArea || content.complete.waitingAreaFallback}
                </p>
                <p
                  className="kiosk-completion-directions mt-5 max-w-[660px] text-[17px] font-bold leading-7 text-[#632f2f]"
                  data-testid="text-directions"
                >
                  {completion?.directions} {content.complete.directionsSuffix}
                </p>

                <dl
                  className="kiosk-completion-summary mt-9 grid w-full max-w-[860px] grid-cols-1 overflow-hidden rounded-[22px] border border-[#e6d6c4] bg-[#fffaf1]/85 text-left shadow-[0_18px_42px_rgba(108,35,35,.09)] sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1.1fr_.8fr]"
                  aria-label="Visit summary"
                  data-testid="visit-summary"
                >
                  <div className="border-b border-[#eadbca] bg-[#f5e1d5]/50 p-4 sm:border-r lg:border-b-0">
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#a26b5f]">
                      <MapPin size={13} aria-hidden="true" />
                      Location
                    </dt>
                    <dd className="mt-2 text-[15px] font-bold text-[#990000]" data-testid="text-location">
                      {completionFloorLabel} · {completion?.waitingArea || content.complete.waitingAreaFallback}
                    </dd>
                  </div>
                  <div className="border-b border-[#eadbca] p-4 lg:border-r lg:border-b-0">
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a26b5f]">
                      {content.complete.providerLabel}
                    </dt>
                    <dd className="mt-2 text-[15px] font-bold text-[#512e2b]" data-testid="text-provider">
                      {completion?.provider}
                    </dd>
                  </div>
                  <div className="border-b border-[#eadbca] p-4 sm:border-r sm:border-b-0 lg:border-r">
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a26b5f]">
                      {content.complete.visitLabel}
                    </dt>
                    <dd className="mt-2 text-[15px] font-bold text-[#512e2b]" data-testid="text-visit-type">
                      {completion?.visitType}
                    </dd>
                  </div>
                  <div className="p-4">
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a26b5f]">
                      {content.complete.timeLabel}
                    </dt>
                    <dd className="mt-2 text-[15px] font-bold text-[#512e2b]" data-testid="text-appointment-time">
                      {completion?.appointmentTime}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  data-testid="button-finish"
                  onClick={startOver}
                  className="kiosk-completion-button mt-5 flex min-h-[68px] w-full max-w-[860px] items-center justify-center rounded-[20px] bg-[#990000] px-6 text-[17px] font-bold text-[#fff9ed] shadow-[0_12px_26px_rgba(122,0,0,.2)] transition hover:-translate-y-0.5 hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
                >
                  {content.complete.doneButton}
                </button>
                <p className="mt-4 text-[11px] leading-5 text-[#9a8074]">
                  {content.complete.demoNotice}
                </p>
              </div>
            ) : screen === "checking" ? (
               <div className="max-w-[560px]">
                <h1
                  className="max-w-[570px] text-[clamp(3rem,5.1vw,5.2rem)] font-semibold leading-[.96] tracking-[-.07em] text-[#990000] font-serif"
                >
                  {content.checking.heading}
                </h1>
              </div>
            ) : (
              <div className="max-w-[520px]">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3e1dc] text-[#990000]">
                  {screen === "appointment" ? <CalendarDays size={23} /> : screen === "demographics" ? <UserRound size={23} /> : screen === "coverage" ? <CreditCard size={23} /> : screen === "consent" ? <FileCheck2 size={23} /> : screen === "questionnaire" ? <ClipboardList size={23} /> : <ShieldCheck size={23} />}
                </div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a8074]">
                  Step {activeStepIndex + 1} of {visibleJourneySteps.length}
                </p>
                <h1
                  className="mt-3 max-w-[520px] text-[clamp(2.75rem,4.6vw,4.7rem)] font-semibold leading-[.97] tracking-[-.065em] text-[#990000] font-serif"
                >
                  {screen === "appointment" && (session?.appointments?.length ? content.appointment.scheduledHeading : content.appointment.noAppointmentHeading)}
                  {screen === "demographics" && "Let's make sure we have it right."}
                  {screen === "coverage" && "How will today's visit be covered?"}
                </h1>
                <p className="mt-6 max-w-[430px] text-[16px] leading-7 text-[#806960]">
                  {screen === "appointment" && (session?.appointments?.length ? content.appointment.scheduledDescription : content.appointment.noAppointmentDescription)}
                  {screen === "demographics" && "Review your details so we can keep your visit moving smoothly."}
                  {screen === "coverage" && "Choose the option that best describes your plan today."}
                </p>
              </div>
            )}
            
            {screen !== "complete" && screen !== "checking" && (
              <div className="mt-10 flex items-center gap-2 text-xs font-medium text-[#9a8478]">
                <LockKeyhole size={14} />
                <span>{content.welcome.privacyNote}</span>
              </div>
            )}
            </section>
          )}

          {screen !== "complete" && (
            <section
              className={`kiosk-card ${screen === "demographics" ? "kiosk-contact-panel" : ""} relative isolate min-h-0 rounded-[30px] border border-[#e7d9c7] bg-[#fffaf1] p-6 shadow-[0_25px_65px_rgba(108,35,35,.12)] sm:p-9 lg:p-11 ${
                isLongFormStage
                  ? "kiosk-long-form-panel flex h-full flex-col overflow-hidden"
                  : "kiosk-card-scroll h-full overflow-y-auto overscroll-contain"
              }`}
            >
            {screen === "welcome" && (
              <div className="kiosk-fade relative">
                <div className="mb-7">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a8074]">{content.welcome.startEyebrow}</p>
                  <h2 className="mt-3 text-[clamp(2.1rem,3.5vw,2.9rem)] font-semibold leading-[1.03] tracking-[-.055em] text-[#990000] font-serif">
                    {content.welcome.startTitle}
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
                       <p className="mt-4 text-sm font-bold text-[#632f2f]">{content.welcome.qrPrompt}</p>
                      <p className="mx-auto mt-1.5 max-w-[350px] text-xs leading-5 text-[#9a8074]">
                         {content.welcome.qrDescription}
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

                  {mode === "universityId" && (
                    <p className="mt-4 text-center text-xs leading-5 text-[#9a8074]">
                      {content.welcome.demoInstructions}
                    </p>
                  )}

                  {renderError()}

                  <div className="mt-8">
                    {primaryButton(
                       mode === "qr" ? content.welcome.qrButton : content.welcome.findVisitButton,
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
                {showSchedulingHandoff ? (
                  <>
                    <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                      {content.appointment.schedulingHeading}
                    </h2>
                    <div
                      className="rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-5 sm:p-6"
                      data-testid="scheduling-handoff"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3e1dc] text-[#990000]">
                          <QrCode size={28} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#632f2f]">
                            {session?.schedulingHandoff.label || "Schedule online"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#806960]">
                            {session?.schedulingHandoff.message}
                          </p>
                        </div>
                      </div>
                      {session?.schedulingHandoff.available && session.schedulingHandoff.url ? (
                        <a
                          href={session.schedulingHandoff.url}
                          target="_blank"
                          rel="noreferrer"
                          data-testid="link-online-scheduler"
                          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#990000] px-5 text-sm font-bold text-[#fff9ed] transition hover:bg-[#7d0000] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
                        >
                          Open online scheduler <ArrowRight size={17} />
                        </a>
                      ) : (
                        <div className="mt-6 rounded-xl bg-[#f4e6d5] p-4 text-sm font-semibold leading-6 text-[#632f2f]">
                          {content.appointment.schedulingUnavailable}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      data-testid="button-back-to-appointment-options"
                      onClick={() => setShowSchedulingHandoff(false)}
                      className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-5 text-sm font-bold text-[#632f2f] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-4 focus:ring-[#990000]/15"
                    >
                       <ArrowLeft size={17} /> {content.appointment.backToOptionsButton}
                    </button>
                  </>
                ) : session?.appointments?.length ? (
                  <>
                    <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                      {content.appointment.scheduledHeading}
                    </h2>
                    <div className="space-y-3">
                      {session.appointments.map((apt) => (
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
                    </div>
                    {renderError()}
                    <div className="mt-8">
                       {primaryButton(content.appointment.confirmButton, continueAppointment, !selectedAppointment, undefined, "button-save-appointment")}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="mb-3 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                      {content.appointment.noAppointmentHeading}
                    </h2>
                    <p className="mb-6 text-sm leading-6 text-[#806960]">
                      {content.appointment.noAppointmentDescription}
                    </p>
                    <div className="grid gap-3" data-testid="no-appointment-options">
                      <button
                        type="button"
                        data-testid="button-front-desk-option"
                        onClick={() => {
                          setFrontDeskSelected(true);
                          clearError();
                        }}
                        className="flex min-h-20 items-center gap-4 rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-4 text-left transition hover:border-[#c9a69a] hover:bg-[#fff6e8] focus:outline-none focus:ring-4 focus:ring-[#990000]/15"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4e6d5] text-[#990000]">
                          <Stethoscope size={21} />
                        </span>
                        <span>
                           <span className="block font-bold text-[#632f2f]">{content.appointment.frontDeskLabel}</span>
                           <span className="mt-1 block text-xs leading-5 text-[#806960]">{content.appointment.frontDeskDescription}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        data-testid="button-online-scheduling"
                        onClick={() => {
                          setShowSchedulingHandoff(true);
                          setFrontDeskSelected(false);
                        }}
                        className="flex min-h-20 items-center gap-4 rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-4 text-left transition hover:border-[#c9a69a] hover:bg-[#fff6e8] focus:outline-none focus:ring-4 focus:ring-[#990000]/15"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3e1dc] text-[#990000]">
                          <QrCode size={21} />
                        </span>
                        <span>
                           <span className="block font-bold text-[#632f2f]">{content.appointment.scheduleLabel}</span>
                           <span className="mt-1 block text-xs leading-5 text-[#806960]">{content.appointment.scheduleDescription}</span>
                        </span>
                      </button>
                    </div>
                    {frontDeskSelected && (
                      <div className="mt-5 rounded-xl bg-[#e6f0e5] p-4 text-sm font-semibold leading-6 text-[#316148]" role="status">
                         {content.appointment.frontDeskConfirmation}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {screen === "demographics" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                <h2 className="kiosk-contact-heading mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                  {content.details.heading}
                </h2>

                <div
                  className="kiosk-contact-identity mb-7 rounded-2xl border border-[#e7d9c7] bg-[#f8efe3] p-5"
                  data-testid="identity-summary"
                  role="group"
                  aria-label="Verified identity information"
                >
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#806960]">
                    <BadgeCheck size={16} className="text-[#316148]" />
                    Verified identity
                  </div>
                  <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["First name", session?.student.firstName, "text-identity-first-name"],
                      ["Last name", session?.student.lastName, "text-identity-last-name"],
                      ["University ID", session?.student.universityId, "text-identity-university-id"],
                      ["Date of birth", session?.student.dateOfBirth, "text-identity-date-of-birth"],
                    ].map(([label, detail, testId]) => (
                      <div key={label}>
                        <dt className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a8074]">{label}</dt>
                        <dd className="mt-1 text-[15px] font-bold text-[#632f2f]" data-testid={testId}>
                          {detail || "Not provided"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="kiosk-contact-fields grid gap-4 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.4fr)_4.25rem_6.25rem_minmax(0,1.6fr)] lg:gap-3">
                  <div className="sm:col-span-4 lg:col-span-2">
                    <label htmlFor="demo-address-1" className="mb-2 block text-sm font-bold text-[#632f2f]">Address line 1</label>
                    <input
                      id="demo-address-1"
                      type="text"
                      autoComplete="address-line1"
                      data-testid="input-address-line-1"
                      value={addressLine1}
                      onChange={(e) => { setAddressLine1(e.target.value); clearError(); }}
                      className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                    />
                  </div>
                  <div className="sm:col-span-4 lg:col-span-2">
                    <label htmlFor="demo-address-2" className="mb-2 block text-sm font-bold text-[#632f2f]">Address line 2</label>
                    <input
                      id="demo-address-2"
                      type="text"
                      autoComplete="address-line2"
                      data-testid="input-address-line-2"
                      value={addressLine2}
                      onChange={(e) => { setAddressLine2(e.target.value); clearError(); }}
                      placeholder="Apartment, suite, or residence hall"
                      className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                      <label htmlFor="demo-city" className="mb-2 block text-sm font-bold text-[#632f2f]">City</label>
                      <input
                        id="demo-city"
                        type="text"
                        autoComplete="address-level2"
                        data-testid="input-city"
                        value={city}
                        onChange={(e) => { setCity(e.target.value); clearError(); }}
                        className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                      />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                      <label htmlFor="demo-state" className="mb-2 block text-sm font-bold text-[#632f2f]">State</label>
                      <input
                        id="demo-state"
                        type="text"
                        autoComplete="address-level1"
                        data-testid="input-state"
                        value={state}
                        maxLength={2}
                        onChange={(e) => { setState(e.target.value.toUpperCase()); clearError(); }}
                        className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold uppercase text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                      />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                      <label htmlFor="demo-zip" className="mb-2 block text-sm font-bold text-[#632f2f]">ZIP</label>
                      <input
                        id="demo-zip"
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        data-testid="input-zip"
                        value={zip}
                        onChange={(e) => { setZip(e.target.value); clearError(); }}
                        className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:bg-[#fff6e8] focus:ring-4 focus:ring-[#990000]/10"
                      />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
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
                </div>

                {renderError()}

                <div className="kiosk-contact-actions mt-8">
                  {primaryButton(
                     content.details.continueButton,
                    continueDemographics,
                    !addressLine1 || !city || !state || !zip || !phone,
                    undefined,
                    "button-save-demographics",
                  )}
                </div>
              </div>
            )}

            {screen === "coverage" && (
              <div className="kiosk-fade relative">
                {renderBack()}
                {showInsuranceInfo ? (
                  <>
                    <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                      {content.coverage.insuranceHeading}
                    </h2>
                    <div className="rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-5" data-testid="insurance-information">
                      {coverage === "self" ? (
                        <div className="flex items-start gap-3">
                          <CreditCard size={20} className="mt-0.5 shrink-0 text-[#990000]" />
                          <div>
                            <p className="font-bold text-[#632f2f]">{content.coverage.selfPayTitle}</p>
                            <p className="mt-1 text-sm leading-6 text-[#806960]">{content.coverage.selfPayDescription}</p>
                          </div>
                        </div>
                      ) : (
                        <dl className="divide-y divide-[#e7d9c7]">
                          {[
                            ["Insurance carrier", coverage === "iu" ? session?.onFileInsuranceInformation.insuranceCarrier : insuranceCarrier],
                            ["Member ID", coverage === "iu" ? session?.onFileInsuranceInformation.memberId : memberId],
                            ["Group number", coverage === "iu" ? session?.onFileInsuranceInformation.groupNumber : groupNumber],
                            ["Subscriber name", coverage === "iu" ? session?.onFileInsuranceInformation.subscriberName : subscriberName],
                          ].map(([label, detail]) => (
                            <div key={label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr]">
                              <dt className="text-xs font-bold uppercase tracking-[.1em] text-[#9a8074]">{label}</dt>
                              <dd className="text-sm font-bold text-[#632f2f]">{detail || "Not provided"}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    <button
                      type="button"
                      data-testid="button-update-insurance"
                      onClick={() => {
                        setShowInsuranceInfo(false);
                        clearError();
                      }}
                      className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-5 text-sm font-bold text-[#632f2f] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-4 focus:ring-[#990000]/15"
                    >
                       <PenLine size={17} /> {content.coverage.updateInsuranceButton}
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="mb-6 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                      {content.coverage.heading}
                    </h2>

                    <div className="space-y-3">
                      {([
                        ["iu", content.coverage.iuOptionTitle, content.coverage.iuOptionDescription],
                        ["other", content.coverage.otherOptionTitle, content.coverage.otherOptionDescription],
                        ["self", content.coverage.selfPayTitle, content.coverage.selfPayDescription],
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
                              const nextCoverage = e.target.value as Coverage;
                              if (nextCoverage === "other" && coverage !== "other") {
                                setInsuranceCarrier("");
                                setMemberId("");
                                setGroupNumber("");
                                setSubscriberName("");
                              }
                              setCoverage(nextCoverage);
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

                    {coverage === "other" && (
                      <div className="mt-5 grid gap-4 rounded-2xl border border-[#e7d9c7] bg-[#fff6e8] p-4 sm:grid-cols-2">
                        {[
                          ["insurance-carrier", "Insurance carrier", insuranceCarrier, setInsuranceCarrier],
                          ["member-id", "Member ID", memberId, setMemberId],
                          ["group-number", "Group number", groupNumber, setGroupNumber],
                          ["subscriber-name", "Subscriber name", subscriberName, setSubscriberName],
                        ].map(([id, label, fieldValue, setter]) => (
                          <div key={id as string}>
                            <label htmlFor={id as string} className="mb-2 block text-sm font-bold text-[#632f2f]">{label as string}</label>
                            <input
                              id={id as string}
                              type="text"
                              data-testid={`input-${id}`}
                              value={fieldValue as string}
                              onChange={(event) => {
                                (setter as (value: string) => void)(event.target.value);
                                clearError();
                              }}
                              className="min-h-12 w-full rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-4 text-[15px] font-semibold text-[#632f2f] outline-none transition focus:border-[#990000] focus:ring-4 focus:ring-[#990000]/10"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      data-testid="button-view-insurance"
                      onClick={() => {
                        setShowInsuranceInfo(true);
                        clearError();
                      }}
                      className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d9c6b5] bg-[#fffaf1] px-5 text-sm font-bold text-[#632f2f] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-4 focus:ring-[#990000]/15"
                    >
                       <Info size={17} /> {content.coverage.viewInsuranceButton}
                    </button>

                    {renderError()}

                    <div className="mt-6">
                      {primaryButton(
                         content.coverage.confirmButton,
                        continueCoverage,
                        !coverage || (coverage === "other" && (!insuranceCarrier || !memberId || !subscriberName)),
                        undefined,
                        "button-save-coverage",
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {screen === "consent" && currentConsent && (
              <div className="kiosk-fade relative flex min-h-0 flex-1 flex-col">
                {renderBack()}
                <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
                  <h2 className="text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                    {currentConsent.title}
                  </h2>
                  {totalConsents > 1 && (
                    <span className="text-sm font-bold uppercase tracking-wider text-[#a5918a]">
                      Form {currentConsentIndex} of {totalConsents}
                    </span>
                  )}
                </div>

                <div className="grid min-h-0 flex-1 grid-rows-[minmax(120px,1fr)_auto] gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)] lg:grid-rows-1 lg:gap-7">
                  <div
                    className="kiosk-consent-document min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-5 pr-4 text-[15px] leading-7 text-[#806960] sm:p-7 sm:pr-6"
                    data-testid="consent-document"
                    tabIndex={0}
                    aria-label={`${currentConsent.title} text`}
                  >
                    <div className="space-y-6">
                      {currentConsent.description.split(/\n\s*\n/).filter(Boolean).map((section, index) => {
                        const lines = section.split("\n");
                        const heading = lines[0];
                        const body = lines.slice(1).join("\n");
                        const isHeading =
                          index === 0 ||
                          /^(Treatment Authorization|Teaching Environment|Infectious Disease Testing|Financial Agreement|Payment Responsibility and Insurance Benefit Authorization|Bursar Account \(if active\)|Referrals|HIPAA Notice of Privacy Practices|Communication Authorization|Duration of Consent|Acknowledgement)$/.test(heading);

                        return (
                          <div key={`${heading}-${index}`}>
                            {isHeading && (
                              <h3 className="mb-1.5 text-[13px] font-bold uppercase tracking-[.08em] text-[#632f2f]">
                                {heading}
                              </h3>
                            )}
                            {isHeading ? (
                              body && <p className="whitespace-pre-wrap">{body}</p>
                            ) : (
                              <p className="whitespace-pre-wrap">{section}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col">
                    <label className="flex shrink-0 cursor-pointer items-start gap-3">
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
                        {content.consent.agreementLabel}
                      </span>
                    </label>

                    <div className="mt-5 shrink-0">
                      <label className="mb-2 block text-sm font-bold text-[#632f2f]">{content.consent.signatureLabel}</label>
                      <SignaturePad
                        ref={signaturePadRef}
                        onBegin={clearError}
                        ariaLabel={`Signature pad for ${currentConsent.title}`}
                      />
                    </div>
                    {renderError()}

                    <div className="mt-5 shrink-0 lg:mt-auto lg:pt-5">
                      {primaryButton(content.consent.continueButton, continueConsent, undefined, undefined, "button-save-consent")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {screen === "questionnaire" && !activeQuestionnaireId && (
              <div className="kiosk-fade relative flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col">
                  {renderBack()}
                  <h2 className="mb-4 shrink-0 text-[clamp(1.7rem,2.5vw,2rem)] font-semibold leading-[1.03] tracking-[-.04em] text-[#990000] font-serif">
                    {content.questions.heading}
                  </h2>

                  <div className="kiosk-questionnaire-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                    <p className="mb-6 text-[15px] font-medium leading-7 text-[#806960]">
                      {content.questions.description}
                    </p>

                    <div className="space-y-4">
                      {session?.questionnaires?.map(q => {
                        const isNotStarted = q.status === "not_started";
                        const isPortal = q.status === "completed_portal";
                        const isNow = q.status === "completed_now";
                        const isCompleted = isPortal || isNow;
                      
                        return (
                          <button
                            key={q.id}
                            type="button"
                            data-testid={`questionnaire-card-${q.id}`}
                            onClick={() => {
                              if (isNotStarted || isPortal) {
                                setActiveQuestionnaireId(q.id);
                                setQuestionnaireAnswers({});
                                clearError();
                              }
                            }}
                            disabled={isNow || isMutating}
                            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                              isCompleted
                                ? "cursor-default border-[#d9c6b5] bg-[#fffaf1] opacity-80"
                                : "cursor-pointer border-[#c1aba0] bg-white shadow-sm hover:border-[#990000] hover:bg-[#fff6e8]"
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <span className={`text-[15px] font-bold ${isCompleted ? "text-[#806960]" : "text-[#632f2f]"}`}>
                                {q.name}
                              </span>
                              {isPortal && (
                                <span className="text-xs font-bold uppercase tracking-wider text-[#806960]">
                                  Completed online
                                </span>
                              )}
                              {isNow && (
                                <span className="text-xs font-bold uppercase tracking-wider text-[#316148]">
                                  Completed
                                </span>
                              )}
                              {isNotStarted && (
                                <span className="text-xs font-bold uppercase tracking-wider text-[#990000]">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isCompleted ? "bg-[#f4e6d5]" : "border border-[#c1aba0] bg-[#fffaf1]"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 size={18} className={isNow ? "text-[#316148]" : "text-[#806960]"} />
                              ) : (
                                <ArrowRight size={16} className="text-[#990000]" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {renderError()}
                  </div>
                </div>
                
                <div className="mt-6 shrink-0">
                  {primaryButton(
                    content.questions.continueButton, 
                    continueQuestions, 
                    session?.questionnaires?.some(q => q.status === "not_started"),
                    undefined,
                    "button-save-questionnaires"
                  )}
                </div>
              </div>
            )}

            {screen === "questionnaire" && activeQuestionnaireId && (
              <div className="kiosk-fade relative flex min-h-0 flex-1 flex-col">
                {(() => {
                  const q = session?.questionnaires?.find(x => x.id === activeQuestionnaireId);
                  if (!q) return null;
                  
                  const isReview = q.status === "completed_portal";
                  
                  const handleSaveQuestionnaire = () => {
                     const missing = q.questions.filter(
                       question =>
                         question.mandatory &&
                         !questionnaireAnswers[question.id]?.trim(),
                     );
                    if (missing.length > 0) {
                      setError("Please answer all required questions.");
                      return;
                    }
                    clearError();

                    if (previewMode) {
                      const updatedQs = session?.questionnaires?.map(x => 
                        x.id === q.id ? { ...x, status: "completed_now" as const } : x
                      ) || [];
                      setSession({ ...session!, questionnaires: updatedQs });
                      setActiveQuestionnaireId(null);
                      return;
                    }

                    saveQuestionnaireMutation.mutate({
                      sessionId: session!.sessionId,
                      data: {
                        questionnaireId: q.id,
                        questionnaireName: q.name,
                        answers: questionnaireAnswers
                      }
                    }, {
                      onSuccess: (data) => {
                        setSession(data);
                        setActiveQuestionnaireId(null);
                      },
                      onError: () => setError("Failed to save answers. Please try again.")
                    });
                  };

                  return (
                    <>
                      <div className="flex-1 overflow-y-auto pr-1">
                        <button
                          type="button"
                          data-testid="button-back-questionnaire"
                          onClick={() => { setActiveQuestionnaireId(null); clearError(); }}
                          className="mb-6 flex min-h-10 items-center gap-2 text-sm font-bold text-[#806259] transition hover:text-[#990000] focus:outline-none focus:ring-2 focus:ring-[#990000]/25"
                        >
                          <ArrowLeft size={17} /> Back
                        </button>

                        <div className="mb-6 pb-4 border-b border-[#d9c6b5]">
                          <h2 className="text-[clamp(1.5rem,2vw,1.75rem)] font-semibold tracking-tight text-[#990000] font-serif">
                            {q.name}
                          </h2>
                          {isReview && (
                            <span className="mt-2 inline-block rounded border border-[#d9c6b5] bg-[#fffaf1] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#806960]">
                              Review only · Completed online
                            </span>
                          )}
                        </div>

                        <div className="space-y-8">
                          {q.questions.map(question => {
                            const value = isReview ? (q.completedAnswers?.[question.id] || "") : (questionnaireAnswers[question.id] || "");
                            
                            return (
                              <div key={question.id} className="flex flex-col gap-3">
                                <label className="text-[15px] font-bold text-[#632f2f]">
                                  {question.text}
                                  {question.mandatory && !isReview && <span className="ml-1 text-[#990000]">*</span>}
                                </label>
                                
                                {question.type === "single_select" && question.options && (
                                  <div className="flex flex-wrap gap-2">
                                    {question.options.map(opt => {
                                      const isSelected = value === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          disabled={isReview}
                                          onClick={() => {
                                            if (!isReview) {
                                              setQuestionnaireAnswers(prev => ({ ...prev, [question.id]: opt.id }));
                                              clearError();
                                            }
                                          }}
                                          className={`rounded-xl border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#990000]/30 ${
                                            isSelected 
                                              ? (isReview ? "border-[#c1aba0] bg-[#fffaf1] text-[#632f2f]" : "border-[#990000] bg-[#fff6e8] text-[#990000] shadow-[0_2px_8px_rgba(153,0,0,.08)]") 
                                              : "border-[#e0c6ba] bg-transparent text-[#806960] hover:bg-[#f4e6d5]"
                                          } ${isReview && !isSelected ? "opacity-50" : ""}`}
                                        >
                                          {opt.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                                
                                {question.type === "free_text" && (
                                  isReview ? (
                                    <div className="rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-4 text-[15px] font-medium text-[#632f2f] min-h-[100px] whitespace-pre-wrap opacity-80">
                                      {value || <span className="text-[#b7a49a] italic">No answer provided</span>}
                                    </div>
                                  ) : (
                                    <textarea
                                      rows={4}
                                      value={value}
                                      onChange={(e) => {
                                        setQuestionnaireAnswers(prev => ({ ...prev, [question.id]: e.target.value }));
                                        clearError();
                                      }}
                                      className="w-full rounded-2xl border border-[#d9c6b5] bg-[#fffaf1] p-4 text-[15px] font-medium text-[#632f2f] placeholder:text-[#b7a49a] focus:border-[#990000] focus:bg-[#fff6e8] focus:outline-none focus:ring-4 focus:ring-[#990000]/10"
                                      placeholder="Type your answer here..."
                                    />
                                  )
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {renderError()}
                      </div>
                      
                      <div className="mt-8 shrink-0">
                        {!isReview ? (
                          primaryButton(
                            "Save Answers",
                            handleSaveQuestionnaire,
                            false,
                            <Check size={18} />,
                            "button-save-questionnaire"
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveQuestionnaireId(null)}
                            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#c1aba0] bg-[#fffaf1] px-5 text-[15px] font-bold text-[#632f2f] transition hover:bg-[#f4e6d5] focus:outline-none focus:ring-4 focus:ring-[#990000]/20"
                          >
                            Return to list
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {screen === "checking" && (
              <div className="kiosk-fade flex min-h-[400px] flex-col items-center justify-center text-center">
                <span className="kiosk-pulse flex items-center gap-2 mb-6" aria-hidden="true">
                  <span className="h-3 w-3 rounded-full bg-[#990000]" />
                  <span className="h-3 w-3 rounded-full bg-[#990000]" />
                  <span className="h-3 w-3 rounded-full bg-[#990000]" />
                </span>
                  <p className="text-lg font-bold text-[#632f2f]">{content.checking.heading}</p>
                  <p className="mt-2 text-sm text-[#806960]">{content.checking.description}</p>
              </div>
            )}

            </section>
          )}
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
