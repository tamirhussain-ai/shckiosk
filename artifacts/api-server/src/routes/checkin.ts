import { Router, type IRouter } from "express";
import {
  CompleteCheckInParams,
  CompleteCheckInResponse,
  IdentifyCheckInBody,
  IdentifyCheckInResponse,
  SaveCheckInAppointmentBody,
  SaveCheckInAppointmentParams,
  SaveCheckInAppointmentResponse,
  SaveCheckInConsentBody,
  SaveCheckInConsentParams,
  SaveCheckInConsentResponse,
  SaveCheckInCoverageBody,
  SaveCheckInCoverageParams,
  SaveCheckInCoverageResponse,
  SaveCheckInDemographicsBody,
  SaveCheckInDemographicsParams,
  SaveCheckInDemographicsResponse,
  SaveCheckInHistoryBody,
  SaveCheckInHistoryParams,
  SaveCheckInHistoryResponse,
  SaveCheckInQuestionnaireBody,
  SaveCheckInQuestionnaireParams,
  SaveCheckInQuestionnaireResponse,
  VerifyCheckInBody,
  VerifyCheckInParams,
  VerifyCheckInResponse,
} from "@workspace/api-zod";
import { checkInAdapter } from "../lib/checkin-adapter";

const router: IRouter = Router();

const invalidRequest = (error: string) => ({ error });

router.post("/checkin/sessions", async (req, res): Promise<void> => {
  const body = IdentifyCheckInBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json(invalidRequest("Enter valid check-in details."));
    return;
  }

  const { method, value, dateOfBirth, qrToken } = body.data;
  const normalizedValue = value?.trim().toLowerCase();
  const normalizedDob = dateOfBirth?.replace(/\s/g, "");
  const isQrValid = method === "qr" && qrToken === "demo-qr-token";
  const isNoAppointmentDemo =
    normalizedValue === "iu000000" ||
    normalizedValue === "noappointment" ||
    normalizedValue === "no-appointment";
  const isManualValid =
    normalizedDob === "10/14/2003" &&
    ((method === "universityId" &&
      (normalizedValue === "iu123456" || isNoAppointmentDemo)) ||
      (method === "lastName" && normalizedValue === "johnson"));

  if (!isQrValid && !isManualValid) {
    res.status(400).json(invalidRequest("Enter valid check-in details."));
    return;
  }

  const session = await checkInAdapter.identify(body.data);
  res.json(IdentifyCheckInResponse.parse(session));
});

router.post(
  "/checkin/sessions/:sessionId/verify",
  async (req, res): Promise<void> => {
    const params = VerifyCheckInParams.safeParse(req.params);
    const body = VerifyCheckInBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json(invalidRequest("Enter the 6-digit secure code."));
      return;
    }

    const verified = await checkInAdapter.verify(
      params.data.sessionId,
      body.data.code,
    );
    if (!verified) {
      res
        .status(400)
        .json(invalidRequest("That code did not match. Please try again."));
      return;
    }

    res.json(VerifyCheckInResponse.parse({ verified: true }));
  },
);

router.patch(
  "/checkin/sessions/:sessionId/appointment",
  async (req, res): Promise<void> => {
    const params = SaveCheckInAppointmentParams.safeParse(req.params);
    const body = SaveCheckInAppointmentBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json(invalidRequest("Select an appointment."));
      return;
    }

    const session = await checkInAdapter.saveAppointment(
      params.data.sessionId,
      body.data,
    );
    if (!session) {
      res.status(400).json(invalidRequest("We could not save that appointment."));
      return;
    }
    res.json(SaveCheckInAppointmentResponse.parse(session));
  },
);

router.patch(
  "/checkin/sessions/:sessionId/demographics",
  async (req, res): Promise<void> => {
    const params = SaveCheckInDemographicsParams.safeParse(req.params);
    const body = SaveCheckInDemographicsBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json(invalidRequest("Complete each address and mobile phone field."));
      return;
    }

    const session = await checkInAdapter.saveDemographics(
      params.data.sessionId,
      body.data,
    );
    if (!session) {
      res.status(400).json(invalidRequest("We could not save those details."));
      return;
    }
    res.json(SaveCheckInDemographicsResponse.parse(session));
  },
);

router.patch(
  "/checkin/sessions/:sessionId/coverage",
  async (req, res): Promise<void> => {
    const params = SaveCheckInCoverageParams.safeParse(req.params);
    const body = SaveCheckInCoverageBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json(invalidRequest("Choose a coverage option."));
      return;
    }
    if (
      body.data.coverage === "other" &&
      (!body.data.insuranceCarrier?.trim() ||
        !body.data.memberId?.trim() ||
        !body.data.subscriberName?.trim())
    ) {
      res.status(400).json(
        invalidRequest(
          "Add the insurance carrier, member ID, and subscriber name.",
        ),
      );
      return;
    }

    const session = await checkInAdapter.saveCoverage(
      params.data.sessionId,
      body.data,
    );
    if (!session) {
      res.status(400).json(invalidRequest("We could not save your coverage."));
      return;
    }
    res.json(SaveCheckInCoverageResponse.parse(session));
  },
);

router.post(
  "/checkin/sessions/:sessionId/consent",
  async (req, res): Promise<void> => {
    const params = SaveCheckInConsentParams.safeParse(req.params);
    const body = SaveCheckInConsentBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json(invalidRequest("Review and sign the consent."));
      return;
    }

    const session = await checkInAdapter.saveConsent(
      params.data.sessionId,
      body.data,
    );
    if (!session) {
      res.status(400).json(invalidRequest("We could not save your consent."));
      return;
    }
    res.json(SaveCheckInConsentResponse.parse(session));
  },
);

router.post(
  "/checkin/sessions/:sessionId/questionnaire",
  async (req, res): Promise<void> => {
    const params = SaveCheckInQuestionnaireParams.safeParse(req.params);
    const body = SaveCheckInQuestionnaireBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json(invalidRequest("Answer each question."));
      return;
    }

    const session = await checkInAdapter.saveQuestionnaire(
      params.data.sessionId,
      body.data,
    );
    if (!session) {
      res.status(400).json(invalidRequest("We could not save those answers."));
      return;
    }
    res.json(SaveCheckInQuestionnaireResponse.parse(session));
  },
);

router.post(
  "/checkin/sessions/:sessionId/history",
  async (req, res): Promise<void> => {
    const params = SaveCheckInHistoryParams.safeParse(req.params);
    const body = SaveCheckInHistoryBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json(invalidRequest("Choose a history option."));
      return;
    }

    const session = await checkInAdapter.saveHistory(
      params.data.sessionId,
      body.data,
    );
    if (!session) {
      res.status(400).json(invalidRequest("We could not save your history."));
      return;
    }
    res.json(SaveCheckInHistoryResponse.parse(session));
  },
);

router.post(
  "/checkin/sessions/:sessionId/complete",
  async (req, res): Promise<void> => {
    const params = CompleteCheckInParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json(invalidRequest("Invalid check-in session."));
      return;
    }

    const completion = await checkInAdapter.complete(params.data.sessionId);
    if (!completion) {
      res.status(400).json(invalidRequest("Complete the remaining steps first."));
      return;
    }
    res.json(CompleteCheckInResponse.parse(completion));
  },
);

export default router;