import { Router, type IRouter } from "express";
import {
  GetKioskContentResponse,
  ResetKioskContentBody,
  ResetKioskContentResponse,
  UpdateKioskContentBody,
  UpdateKioskContentResponse,
} from "@workspace/api-zod";
import { kioskContentStore } from "../lib/kiosk-content-store";

const router: IRouter = Router();

router.get("/kiosk/content", async (_req, res): Promise<void> => {
  res.json(GetKioskContentResponse.parse(await kioskContentStore.get()));
});

router.put("/kiosk/content", async (req, res): Promise<void> => {
  const body = UpdateKioskContentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Content must include a valid value for every field." });
    return;
  }

  const content = await kioskContentStore.update(body.data);
  if (!content) {
    res.status(400).json({ error: "Content cannot contain blank fields." });
    return;
  }
  res.json(UpdateKioskContentResponse.parse(content));
});

router.post("/kiosk/content/reset", async (req, res): Promise<void> => {
  const body = ResetKioskContentBody.safeParse(req.body ?? {});
  if (!body.success) {
    res.status(400).json({ error: "Choose a valid screen to reset." });
    return;
  }

  const content = await kioskContentStore.reset(body.data);
  if (!content) {
    res.status(400).json({ error: "We could not reset kiosk content." });
    return;
  }
  res.json(ResetKioskContentResponse.parse(content));
});

export default router;