import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkinRouter from "./checkin";
import kioskContentRouter from "./kiosk-content";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkinRouter);
router.use(kioskContentRouter);

export default router;
