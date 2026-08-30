import assert from "node:assert/strict";
import test from "node:test";

import { MockCheckInAdapter } from "./checkin-adapter";

const demographics = {
  addressLine1: "123 Sample Street",
  addressLine2: "Apartment 4B",
  city: "Bloomington",
  state: "IN",
  zip: "47406",
  phone: "8125550148",
};

const questionnaireInput = {
  questionnaireId: "reason-for-visit",
  questionnaireName: "Reason for Visit",
  answers: {
    "primary-concern": "A sore throat",
    "symptom-duration": "today",
    "urgent-concern": "no",
  },
};

async function prepareEncounter(appointmentId: string) {
  const adapter = new MockCheckInAdapter();
  const identified = await adapter.identify({
    method: "universityId",
    value: "iu123456",
    dateOfBirth: "10/14/2003",
  });
  assert.ok(await adapter.saveDemographics(identified.sessionId, demographics));
  const encounter = await adapter.saveAppointment(identified.sessionId, {
    appointmentId,
  });
  assert.ok(encounter);
  const covered = await adapter.saveCoverage(identified.sessionId, {
    coverage: "self",
  });
  assert.ok(covered);
  return { adapter, sessionId: identified.sessionId, covered };
}

test("consent-free encounter proceeds directly to its questionnaires", async () => {
  const { adapter, sessionId, covered } =
    await prepareEncounter("same-day-0900");

  assert.equal(covered.consentForms.length, 0);
  assert.equal(
    covered.questionnaires.filter(
      (questionnaire) => questionnaire.status === "not_started",
    ).length,
    1,
  );
  assert.ok(
    await adapter.saveQuestionnaire(sessionId, questionnaireInput),
  );
});

test("questionnaire-free encounter completes after required consent", async () => {
  const { adapter, sessionId, covered } =
    await prepareEncounter("wellness-1415");

  assert.equal(covered.questionnaires.length, 0);
  assert.equal(
    covered.consentForms.filter((form) => form.status === "unsigned").length,
    2,
  );
  assert.equal(await adapter.complete(sessionId), null);
  assert.ok(
    await adapter.saveConsent(sessionId, {
      accepted: true,
      signatureName: "Avery Johnson",
    }),
  );
  assert.equal((await adapter.complete(sessionId))?.completed, true);
});

test("encounter with no linked forms completes from coverage", async () => {
  const { adapter, sessionId, covered } =
    await prepareEncounter("immunization-1630");

  assert.equal(covered.consentForms.length, 0);
  assert.equal(covered.questionnaires.length, 0);
  assert.equal((await adapter.complete(sessionId))?.completed, true);
});

test("annual consent and portal questionnaire remain satisfied", async () => {
  const { adapter, sessionId, covered } =
    await prepareEncounter("annual-review-1545");

  assert.ok(covered.consentForms.every((form) => form.status === "signed"));
  assert.equal(covered.questionnaires.length, 1);
  assert.equal(covered.questionnaires[0]?.status, "completed_portal");
  assert.equal(
    await adapter.saveQuestionnaire(sessionId, {
      questionnaireId: "phq-9",
      questionnaireName: "PHQ-9 Depression Screening",
      answers: { "phq-interest": "not_at_all" },
    }),
    null,
  );
  assert.equal((await adapter.complete(sessionId))?.completed, true);
});

test("required consent blocks questionnaire submission until signed", async () => {
  const { adapter, sessionId } = await prepareEncounter("primary-care-1030");

  assert.equal(
    await adapter.saveQuestionnaire(sessionId, questionnaireInput),
    null,
  );
  assert.ok(
    await adapter.saveConsent(sessionId, {
      accepted: true,
      signatureName: "Avery Johnson",
    }),
  );
  assert.ok(
    await adapter.saveQuestionnaire(sessionId, questionnaireInput),
  );
});