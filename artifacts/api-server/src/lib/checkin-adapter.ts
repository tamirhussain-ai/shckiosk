import {
  type AppointmentSelection,
  type CheckInIdentification,
  type CheckInSession,
  type CompletionResult,
  type ConsentInput,
  type CoverageSelection,
  type Demographics,
  type HistoryInput,
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
  consent?: ConsentInput;
  questionnaire?: QuestionnaireInput;
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
    addressLine2: "First floor · Primary Care waiting area",
  },
  jordanLewis: {
    displayName: "Jordan Lewis, NP",
    addressLine2: "Second floor · Wellness waiting area",
  },
} as const;

const kioskFloor = "Second floor";

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
    delete record.consent;
  }
  if (stageOrder.indexOf(stage) < stageOrder.indexOf("questionnaire")) {
    delete record.questionnaire;
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
          type: "Primary care visit",
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
    };

    this.sessions.set(sessionId, {
      session,
      verified: true,
      stage: "identified",
      verificationExpiresAt: Date.now() + 10 * 60 * 1000,
      verificationAttempts: 0,
      onFileInsuranceInformation,
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
    if (
      !record ||
      !isAtLeast(record, "coverage") ||
      !input.accepted ||
      input.signatureName.trim().length < 2
    ) {
      return null;
    }
    record.consent = input;
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
      !isAtLeast(record, "consent") ||
      Object.keys(input.answers).length < 3
    ) {
      return null;
    }
    record.questionnaire = input;
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
    if (!record?.history || record.stage !== "history") return null;
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
    return {
      completed: true,
      nextStep: isCurrentFloor
        ? `You’re on the right floor. Take a seat in the ${waitingArea}.`
        : `Proceed to the ${floorLabel} and ${waitingArea}.`,
      directions: isCurrentFloor
        ? `You’re on the right floor. Take a seat in the ${waitingArea}.`
        : `Proceed to the ${floorLabel.toLowerCase()} and ${waitingArea}.`,
      provider: appointment.provider,
      visitType: appointment.type,
      appointmentTime: appointment.time,
      addressLine2: appointment.addressLine2,
      floorLabel,
      waitingArea,
      kioskFloor,
      isCurrentFloor,
    };
  }
}

export const checkInAdapter: CheckInAdapter = new MockCheckInAdapter();