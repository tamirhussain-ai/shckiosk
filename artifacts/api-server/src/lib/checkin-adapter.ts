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
  "appointment",
  "demographics",
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

const consentFormTemplates: ConsentForm[] = [
  {
    id: "hipaa-notice",
    title: "HIPAA Notice of Privacy Practices",
    description:
      "Acknowledge that you received and reviewed the IU Student Health Center Notice of Privacy Practices.",
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

const createConsentForms = (): ConsentForm[] =>
  consentFormTemplates.map((form) => ({ ...form }));

const createQuestionnaires = (): Questionnaire[] =>
  questionnaireTemplates.map((questionnaire) => ({
    ...questionnaire,
    questions: questionnaire.questions.map((question) => ({
      ...question,
      options: question.options?.map((option) => ({ ...option })),
    })),
    completedAnswers: questionnaire.completedAnswers
      ? { ...questionnaire.completedAnswers }
      : undefined,
  }));

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
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("coverage")) {
    delete record.coverage;
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("consent")) {
    record.consentSubmissions.clear();
    record.session.consentForms = record.session.consentForms.map((form) => ({
      ...form,
      status: "unsigned",
    }));
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("questionnaire")) {
    record.questionnaireSubmissions.clear();
    record.session.questionnaires = record.session.questionnaires.map(
      (questionnaire) =>
        questionnaire.status === "completed_now"
          ? {
              ...questionnaire,
              status: "not_started",
              completedAnswers: undefined,
            }
          : questionnaire,
    );
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("history")) {
    delete record.history;
  }
  record.stage = stage;
};

class MockCheckInAdapter implements CheckInAdapter {
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
    const session: CheckInSession = {
      sessionId,
      requiresVerification: false,
      student: {
        firstName: "Avery",
        lastName: "Johnson",
        phone: "(812) 555-0148",
        email: "avery.johnson@iu.edu",
        addressLine1: "123 Sample Street",
        addressLine2: "Apartment 4B",
        city: "Bloomington",
        state: "IN",
        zip: "47406",
      },
      appointments: isNoAppointmentDemo(input)
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
          ],
      insuranceInformation: { ...onFileInsuranceInformation },
      onFileInsuranceInformation: { ...onFileInsuranceInformation },
      schedulingHandoff: getSchedulingHandoff(),
      consentForms: createConsentForms(),
      questionnaires: createQuestionnaires(),
    };

    this.sessions.set(sessionId, {
      session,
      verified: true,
      stage: "identified",
      verificationExpiresAt: Date.now() + 10 * 60 * 1000,
      verificationAttempts: 0,
      onFileInsuranceInformation,
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
    if (!record || !record.verified || !isAtLeast(record, "identified")) {
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
    return record.session;
  }

  async saveDemographics(
    sessionId: string,
    input: Demographics,
  ): Promise<CheckInSession | null> {
    await wait(180);
    const record = this.sessions.get(sessionId);
    if (
      !record?.appointmentId ||
      !record.verified ||
      !isAtLeast(record, "appointment")
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
    if (!record || !isAtLeast(record, "demographics")) return null;
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
    if (!record || !isAtLeast(record, "consent")) {
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
        record.stage !== "consent")
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