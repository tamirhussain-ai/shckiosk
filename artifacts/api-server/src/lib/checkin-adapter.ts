import {
  type AppointmentSelection,
  type CheckInIdentification,
  type CheckInSession,
  type CompletionResult,
  type ConsentForm,
  type ConsentInput,
  type CoverageSelection,
  type Demographics,
  type HistoryInput,
  type Questionnaire,
  type QuestionnaireInput,
} from "@workspace/api-zod";

type CheckInStage =
  | "identified"
  | "appointment"
  | "demographics"
  | "coverage"
  | "consent"
  | "questionnaire"
  | "history";

type SessionRecord = {
  session: CheckInSession;
  verified: boolean;
  stage: CheckInStage;
  verificationExpiresAt: number;
  verificationAttempts: number;
  appointmentId?: string;
  coverage?: CoverageSelection["coverage"];
  onFileInsuranceInformation: CheckInSession["onFileInsuranceInformation"];
  encounterConsentForms: ConsentForm[];
  encounterQuestionnaires: Questionnaire[];
  consentSubmissions: Map<string, ConsentInput>;
  questionnaireSubmissions: Map<string, QuestionnaireInput>;
  history?: HistoryInput;
};

export interface CheckInAdapter {
  identify(input: CheckInIdentification): Promise<CheckInSession>;
  verify(sessionId: string, code: string): Promise<boolean>;
  saveAppointment(
    sessionId: string,
    input: AppointmentSelection,
  ): Promise<CheckInSession | null>;
  saveDemographics(
    sessionId: string,
    input: Demographics,
  ): Promise<CheckInSession | null>;
  saveCoverage(
    sessionId: string,
    input: CoverageSelection,
  ): Promise<CheckInSession | null>;
  saveConsent(
    sessionId: string,
    input: ConsentInput,
  ): Promise<CheckInSession | null>;
  saveQuestionnaire(
    sessionId: string,
    input: QuestionnaireInput,
  ): Promise<CheckInSession | null>;
  saveHistory(
    sessionId: string,
    input: HistoryInput,
  ): Promise<CheckInSession | null>;
  complete(sessionId: string): Promise<CompletionResult | null>;
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const isValidPngDataUrl = (value: string | undefined) => {
  if (!value || value.length > 100_000) return false;
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[1], "base64");
  if (
    bytes.length < 60 ||
    bytes.length > 75_000 ||
    !bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  ) {
    return false;
  }

  let offset = 8;
  let sawHeader = false;
  let sawImageData = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (length > 75_000 || chunkEnd > bytes.length) return false;

    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const expectedCrc = bytes.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(bytes.subarray(offset + 4, offset + 8 + length));
    if (expectedCrc !== actualCrc) return false;

    if (!sawHeader) {
      if (type !== "IHDR" || length !== 13) return false;
      const width = bytes.readUInt32BE(offset + 8);
      const height = bytes.readUInt32BE(offset + 12);
      const bitDepth = bytes[offset + 16];
      const colorType = bytes[offset + 17];
      const allowedBitDepths: Record<number, number[]> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      };
      if (
        width < 1 ||
        height < 1 ||
        width > 4096 ||
        height > 4096 ||
        width * height > 8_000_000 ||
        !allowedBitDepths[colorType]?.includes(bitDepth) ||
        bytes[offset + 18] !== 0 ||
        bytes[offset + 19] !== 0 ||
        ![0, 1].includes(bytes[offset + 20])
      ) {
        return false;
      }
      sawHeader = true;
    } else if (type === "IHDR") {
      return false;
    }

    if (type === "IDAT") sawImageData = true;
    offset = chunkEnd;
    if (type === "IEND") {
      return length === 0 && sawHeader && sawImageData && offset === bytes.length;
    }
  }
  return false;
};

const isValidQuestionnaireAnswers = (
  questionnaire: Questionnaire,
  answers: QuestionnaireInput["answers"],
) => {
  const questionById = new Map(
    questionnaire.questions.map((question) => [question.id, question]),
  );
  if (
    Object.keys(answers).length > questionnaire.questions.length ||
    Object.keys(answers).some((id) => !questionById.has(id))
  ) {
    return false;
  }

  return questionnaire.questions.every((question) => {
    const answer = answers[question.id];
    if (question.mandatory && !answer?.trim()) return false;
    if (answer === undefined) return true;
    if (answer.length > 2_000) return false;
    if (question.type === "single_select") {
      return question.options?.some((option) => option.id === answer) ?? false;
    }
    return true;
  });
};

const stageOrder: CheckInStage[] = [
  "identified",
  "demographics",
  "appointment",
  "coverage",
  "consent",
  "questionnaire",
  "history",
];

const providerAccounts = {
  mayaPatel: {
    displayName: "Maya Patel, MD",
    addressLine2: "First floor · Waiting Area",
  },
  jordanLewis: {
    displayName: "Jordan Lewis, NP",
    addressLine2: "Second floor · Waiting Area",
  },
} as const;

const kioskFloor = "Second floor";

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

const consentFormTemplates: ConsentForm[] = [
  {
    id: "hipaa-notice",
    title: "General Consent Form",
    description: generalConsentDescription,
    requiresSignature: true,
    status: "unsigned",
  },
  {
    id: "release-of-information",
    title: "Release of Information",
    description:
      "Authorize the care team to use and share information as described for treatment, payment, and health care operations.",
    requiresSignature: true,
    status: "unsigned",
  },
];

const phqOptions = [
  { id: "not_at_all", label: "Not at all" },
  { id: "several_days", label: "Several days" },
  { id: "more_than_half", label: "More than half the days" },
  { id: "nearly_every_day", label: "Nearly every day" },
];

const questionnaireTemplates: Questionnaire[] = [
  {
    id: "reason-for-visit",
    name: "Reason for Visit",
    status: "not_started",
    questions: [
      {
        id: "primary-concern",
        text: "What would you most like help with today?",
        type: "free_text",
        mandatory: true,
      },
      {
        id: "symptom-duration",
        text: "How long has this concern been present?",
        type: "single_select",
        mandatory: true,
        options: [
          { id: "today", label: "Started today" },
          { id: "few-days", label: "A few days" },
          { id: "few-weeks", label: "A few weeks" },
          { id: "longer", label: "Longer" },
        ],
      },
      {
        id: "urgent-concern",
        text: "Is there anything urgent you want your care team to know?",
        type: "single_select",
        mandatory: true,
        options: [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
          { id: "discuss", label: "I’d like to talk about it" },
        ],
      },
    ],
  },
  {
    id: "phq-9",
    name: "PHQ-9 Depression Screening",
    status: "completed_portal",
    questions: [
      {
        id: "phq-interest",
        text: "Little interest or pleasure in doing things",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-down",
        text: "Feeling down, depressed, or hopeless",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-sleep",
        text: "Trouble falling or staying asleep, or sleeping too much",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-energy",
        text: "Feeling tired or having little energy",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-appetite",
        text: "Poor appetite or overeating",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-self",
        text: "Feeling bad about yourself or that you have let yourself or your family down",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-focus",
        text: "Trouble concentrating on things",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-movement",
        text: "Moving or speaking slowly, or being unusually fidgety or restless",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
      {
        id: "phq-harm",
        text: "Thoughts that you would be better off dead or of hurting yourself",
        type: "single_select",
        mandatory: true,
        options: phqOptions,
      },
    ],
    completedAnswers: {
      "phq-interest": "not_at_all",
      "phq-down": "not_at_all",
      "phq-sleep": "several_days",
      "phq-energy": "several_days",
      "phq-appetite": "not_at_all",
      "phq-self": "not_at_all",
      "phq-focus": "not_at_all",
      "phq-movement": "not_at_all",
      "phq-harm": "not_at_all",
    },
  },
];

const cloneConsentForms = (forms: ConsentForm[]): ConsentForm[] =>
  forms.map((form) => ({ ...form }));

const cloneQuestionnaires = (questionnaires: Questionnaire[]): Questionnaire[] =>
  questionnaires.map((questionnaire) => ({
    ...questionnaire,
    questions: questionnaire.questions.map((question) => ({
      ...question,
      options: question.options?.map((option) => ({ ...option })),
    })),
    completedAnswers: questionnaire.completedAnswers
      ? { ...questionnaire.completedAnswers }
      : undefined,
  }));

const createConsentForms = (
  status: ConsentForm["status"] = "unsigned",
): ConsentForm[] =>
  cloneConsentForms(
    consentFormTemplates.map((form) => ({ ...form, status })),
  );

const createQuestionnaires = (
  statusOverrides?: Partial<Record<Questionnaire["id"], Questionnaire["status"]>>,
): Questionnaire[] =>
  cloneQuestionnaires(
    questionnaireTemplates.map((questionnaire) => ({
      ...questionnaire,
      status: statusOverrides?.[questionnaire.id] ?? questionnaire.status,
    })),
  );

type EncounterRequirements = {
  consentForms: ConsentForm[];
  questionnaires: Questionnaire[];
};

const getEncounterRequirements = (
  appointmentId: string,
): EncounterRequirements => {
  switch (appointmentId) {
    case "wellness-1415":
      return { consentForms: createConsentForms(), questionnaires: [] };
    case "same-day-0900":
      return {
        consentForms: [],
        questionnaires: createQuestionnaires(),
      };
    case "annual-review-1545":
      return {
        consentForms: createConsentForms("signed"),
        questionnaires: createQuestionnaires().filter(
          (questionnaire) => questionnaire.id === "phq-9",
        ),
      };
    case "immunization-1630":
      return { consentForms: [], questionnaires: [] };
    default:
      return {
        consentForms: createConsentForms(),
        questionnaires: createQuestionnaires(),
      };
  }
};

const applyEncounterRequirements = (
  record: SessionRecord,
  appointmentId: string,
) => {
  const requirements = getEncounterRequirements(appointmentId);
  record.encounterConsentForms = cloneConsentForms(requirements.consentForms);
  record.encounterQuestionnaires = cloneQuestionnaires(requirements.questionnaires);
  record.session.consentForms = cloneConsentForms(record.encounterConsentForms);
  record.session.questionnaires = cloneQuestionnaires(record.encounterQuestionnaires);
};

const fallbackSchedulingHandoff: CheckInSession["schedulingHandoff"] = {
  mode: "qr-link",
  available: false,
  label: "Schedule online",
  message:
    "Scan the online scheduler QR code or use the scheduling link provided by the front desk.",
};

// This adapter is intentionally the seam for the shared scheduler integration.
// A connected implementation can return a REST-backed handoff without changing
// the check-in flow or its API contract.
const getSchedulingHandoff = (): CheckInSession["schedulingHandoff"] => {
  const schedulerUrl = process.env.ONLINE_SCHEDULER_URL?.trim();
  if (!schedulerUrl) return fallbackSchedulingHandoff;
  return {
    mode: "rest",
    available: true,
    label: "Open online scheduler",
    message: "Continue in IU's online appointment scheduler.",
    url: schedulerUrl,
  };
};

const isNoAppointmentDemo = (input: CheckInIdentification) => {
  const normalizedValue = input.value?.trim().toLowerCase();
  return (
    normalizedValue === "iu000000" ||
    normalizedValue === "noappointment" ||
    normalizedValue === "no-appointment"
  );
};

const isAtLeast = (record: SessionRecord, stage: CheckInStage) =>
  stageOrder.indexOf(record.stage) >= stageOrder.indexOf(stage);

const invalidateAfter = (record: SessionRecord, stage: CheckInStage) => {
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("appointment")) {
    delete record.appointmentId;
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("coverage")) {
    delete record.coverage;
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("consent")) {
    record.consentSubmissions.clear();
    record.session.consentForms = cloneConsentForms(record.encounterConsentForms);
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("questionnaire")) {
    record.questionnaireSubmissions.clear();
    record.session.questionnaires = cloneQuestionnaires(record.encounterQuestionnaires);
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("history")) {
    delete record.history;
  }
  record.stage = stage;
};

export class MockCheckInAdapter implements CheckInAdapter {
  private readonly sessions = new Map<string, SessionRecord>();

  async identify(input: CheckInIdentification): Promise<CheckInSession> {
    await wait(300);

    const sessionId = crypto.randomUUID();
    const onFileInsuranceInformation = {
      insuranceCarrier: "IU Student Insurance",
      memberId: "IU-104928",
      groupNumber: "IUSHC-2025",
      subscriberName: "Avery Johnson",
    };
    const hasAppointments = !isNoAppointmentDemo(input);
    const initialEncounterRequirements = hasAppointments
      ? getEncounterRequirements("primary-care-1030")
      : { consentForms: [], questionnaires: [] };
    const session: CheckInSession = {
      sessionId,
      requiresVerification: false,
      student: {
        firstName: "Avery",
        lastName: "Johnson",
        universityId: "iu123456",
        dateOfBirth: "10/14/2003",
        phone: "(812) 555-0148",
        email: "avery.johnson@iu.edu",
        addressLine1: "123 Sample Street",
        addressLine2: "Apartment 4B",
        city: "Bloomington",
        state: "IN",
        zip: "47406",
      },
      appointments: !hasAppointments
        ? []
        : [
        {
          id: "primary-care-1030",
          date: "Today, October 14",
          time: "10:30 AM",
          provider: providerAccounts.mayaPatel.displayName,
          type: "Care team visit",
          location: "Student Health Center · First floor",
          addressLine2: providerAccounts.mayaPatel.addressLine2,
        },
        {
          id: "wellness-1415",
          date: "Today, October 14",
          time: "2:15 PM",
          provider: providerAccounts.jordanLewis.displayName,
          type: "Wellness visit",
          location: "Student Health Center · Second floor",
          addressLine2: providerAccounts.jordanLewis.addressLine2,
        },
        {
          id: "same-day-0900",
          date: "Today, October 14",
          time: "9:00 AM",
          provider: providerAccounts.mayaPatel.displayName,
          type: "Same-day visit",
          location: "Student Health Center · First floor",
          addressLine2: providerAccounts.mayaPatel.addressLine2,
        },
        {
          id: "annual-review-1545",
          date: "Today, October 14",
          time: "3:45 PM",
          provider: providerAccounts.jordanLewis.displayName,
          type: "Annual review",
          location: "Student Health Center · Second floor",
          addressLine2: providerAccounts.jordanLewis.addressLine2,
        },
        {
          id: "immunization-1630",
          date: "Today, October 14",
          time: "4:30 PM",
          provider: providerAccounts.mayaPatel.displayName,
          type: "Immunization visit",
          location: "Student Health Center · First floor",
          addressLine2: providerAccounts.mayaPatel.addressLine2,
        },
          ],
      insuranceInformation: { ...onFileInsuranceInformation },
      onFileInsuranceInformation: { ...onFileInsuranceInformation },
      schedulingHandoff: getSchedulingHandoff(),
      consentForms: cloneConsentForms(initialEncounterRequirements.consentForms),
      questionnaires: cloneQuestionnaires(initialEncounterRequirements.questionnaires),
    };

    this.sessions.set(sessionId, {
      session,
      verified: true,
      stage: "identified",
      verificationExpiresAt: Date.now() + 10 * 60 * 1000,
      verificationAttempts: 0,
      onFileInsuranceInformation,
      encounterConsentForms: cloneConsentForms(
        initialEncounterRequirements.consentForms,
      ),
      encounterQuestionnaires: cloneQuestionnaires(
        initialEncounterRequirements.questionnaires,
      ),
      consentSubmissions: new Map(),
      questionnaireSubmissions: new Map(),
    });

    return session;
  }

  async verify(sessionId: string, code: string): Promise<boolean> {
    await wait(220);
    const record = this.sessions.get(sessionId);
    if (
      !record ||
      record.verificationAttempts >= 5 ||
      record.verificationExpiresAt < Date.now()
    ) {
      return false;
    }
    record.verificationAttempts += 1;
    if (code !== "123456") return false;
    record.verified = true;
    invalidateAfter(record, "identified");
    return true;
  }

  async saveAppointment(
    sessionId: string,
    input: AppointmentSelection,
  ): Promise<CheckInSession | null> {
    await wait(180);
    const record = this.sessions.get(sessionId);
    if (!record || !record.verified || !isAtLeast(record, "demographics")) {
      return null;
    }
    if (
      !record.session.appointments.some(
        (appointment) => appointment.id === input.appointmentId,
      )
    ) {
      return null;
    }
    record.appointmentId = input.appointmentId;
    invalidateAfter(record, "appointment");
    applyEncounterRequirements(record, input.appointmentId);
    return record.session;
  }

  async saveDemographics(
    sessionId: string,
    input: Demographics,
  ): Promise<CheckInSession | null> {
    await wait(180);
    const record = this.sessions.get(sessionId);
    if (
      !record ||
      !record.verified ||
      !isAtLeast(record, "identified")
    ) {
      return null;
    }
    record.session.student = { ...record.session.student, ...input };
    invalidateAfter(record, "demographics");
    return record.session;
  }

  async saveCoverage(
    sessionId: string,
    input: CoverageSelection,
  ): Promise<CheckInSession | null> {
    await wait(180);
    const record = this.sessions.get(sessionId);
    if (
      !record ||
      !record.verified ||
      !isAtLeast(record, "appointment")
    ) {
      return null;
    }
    if (
      input.coverage === "other" &&
      (!input.insuranceCarrier?.trim() ||
        !input.memberId?.trim() ||
        !input.subscriberName?.trim())
    ) {
      return null;
    }
    record.coverage = input.coverage;
    if (input.coverage === "other") {
      record.session.insuranceInformation = {
        insuranceCarrier: input.insuranceCarrier?.trim() || "",
        memberId: input.memberId?.trim() || "",
        groupNumber: input.groupNumber?.trim() || "",
        subscriberName: input.subscriberName?.trim() || "",
      };
    } else if (input.coverage === "iu") {
      record.session.insuranceInformation = {
        ...record.onFileInsuranceInformation,
      };
    } else {
      record.session.insuranceInformation = {
        insuranceCarrier: "",
        memberId: "",
        groupNumber: "",
        subscriberName: "",
      };
    }
    invalidateAfter(record, "coverage");
    return record.session;
  }

  async saveConsent(
    sessionId: string,
    input: ConsentInput,
  ): Promise<CheckInSession | null> {
    await wait(180);
    const record = this.sessions.get(sessionId);
    const hasLegacySignature = (input.signatureName?.trim().length ?? 0) >= 2;
    if (
      !record ||
      !isAtLeast(record, "coverage") ||
      !input.accepted ||
      (!isValidPngDataUrl(input.signatureData) && !hasLegacySignature)
    ) {
      return null;
    }

    const formId = input.formId?.trim();
    if (formId) {
      const nextUnsignedForm = record.session.consentForms.find(
        (item) => item.status === "unsigned",
      );
      if (!nextUnsignedForm || nextUnsignedForm.id !== formId) return null;
      record.consentSubmissions.set(formId, { ...input, formId });
      record.session.consentForms = record.session.consentForms.map((item) =>
        item.id === formId ? { ...item, status: "signed" } : item,
      );
    } else {
      // Legacy clients sent one typed signature without a form identifier.
      // Treat that request as acceptance of the legacy combined consent.
      record.session.consentForms = record.session.consentForms.map((form) => ({
        ...form,
        status: "signed",
      }));
      for (const form of record.session.consentForms) {
        record.consentSubmissions.set(form.id, { ...input, formId: form.id });
      }
    }

    invalidateAfter(record, "consent");
    return record.session;
  }

  async saveQuestionnaire(
    sessionId: string,
    input: QuestionnaireInput,
  ): Promise<CheckInSession | null> {
    await wait(180);
    const record = this.sessions.get(sessionId);
    if (
      !record ||
      !isAtLeast(record, "coverage") ||
      record.session.consentForms.some((form) => form.status === "unsigned")
    ) {
      return null;
    }

    const questionnaireId = input.questionnaireId?.trim();
    const questionnaireName = input.questionnaireName?.trim();
    const questionnaire =
      record.session.questionnaires.find(
        (item) =>
          (questionnaireId && item.id === questionnaireId) ||
          (questionnaireName && item.name === questionnaireName),
      ) ??
      (!questionnaireId && !questionnaireName
        ? record.session.questionnaires.find(
            (item) => item.status === "not_started",
          )
        : undefined);
    if (!questionnaire || questionnaire.status === "completed_portal") {
      return null;
    }

    const isLegacySubmission = !questionnaireId && !questionnaireName;
    const legacyAnswerIds = ["feeling", "medications", "safety"];
    const hasAllRequiredAnswers = isLegacySubmission
      ? Object.keys(input.answers).length === legacyAnswerIds.length &&
        legacyAnswerIds.every(
          (id) =>
            ["yes", "no", "unsure"].includes(input.answers[id] ?? ""),
        )
      : isValidQuestionnaireAnswers(questionnaire, input.answers);
    if (!hasAllRequiredAnswers) return null;

    record.session.questionnaires = record.session.questionnaires.map((item) =>
      item.id === questionnaire.id
        ? {
            ...item,
            status: "completed_now",
            completedAnswers: { ...input.answers },
          }
        : item,
    );
    record.questionnaireSubmissions.set(questionnaire.id, {
      ...input,
      questionnaireId: questionnaire.id,
      questionnaireName: questionnaire.name,
      answers: { ...input.answers },
    });
    invalidateAfter(record, "questionnaire");
    return record.session;
  }

  async saveHistory(
    sessionId: string,
    input: HistoryInput,
  ): Promise<CheckInSession | null> {
    await wait(180);
    const record = this.sessions.get(sessionId);
    if (!record || !isAtLeast(record, "questionnaire")) return null;
    record.history = input;
    invalidateAfter(record, "history");
    return record.session;
  }

  async complete(sessionId: string): Promise<CompletionResult | null> {
    await wait(500);
    const record = this.sessions.get(sessionId);
    const questionnairesComplete = record?.session.questionnaires.every(
      (questionnaire) => questionnaire.status !== "not_started",
    );
    if (
      !record ||
      !questionnairesComplete ||
      !record.session.consentForms.every((form) => form.status === "signed") ||
      (record.stage !== "questionnaire" &&
        record.stage !== "history" &&
        record.stage !== "consent" &&
        record.stage !== "coverage")
    ) {
      return null;
    }
    const appointment = record.session.appointments.find(
      (item) => item.id === record.appointmentId,
    );
    if (!appointment) return null;
    const [floorLabel, waitingArea] = appointment.addressLine2
      .split("·")
      .map((part) => part.trim());
    if (!floorLabel || !waitingArea) return null;
    const isCurrentFloor = floorLabel.toLowerCase() === kioskFloor.toLowerCase();
    this.sessions.delete(sessionId);
    const normalizedWaitingArea = waitingArea.toLowerCase() === "waiting area"
      ? "Waiting Area"
      : waitingArea;
    const waitingAreaLabel = normalizedWaitingArea.toLowerCase() === "waiting area"
      ? "waiting area"
      : `${normalizedWaitingArea} waiting area`;
    const directions = isCurrentFloor
      ? `You’re on the right floor. Please have a seat in the ${waitingAreaLabel}.`
      : `Proceed to the ${floorLabel.toLowerCase()} waiting area.`;
    return {
      completed: true,
      nextStep: isCurrentFloor
        ? directions
        : directions,
      directions,
      provider: appointment.provider,
      visitType: appointment.type,
      appointmentTime: appointment.time,
      addressLine2: appointment.addressLine2,
      floorLabel,
      waitingArea: normalizedWaitingArea,
      kioskFloor,
      isCurrentFloor,
    };
  }
}

export const checkInAdapter: CheckInAdapter = new MockCheckInAdapter();