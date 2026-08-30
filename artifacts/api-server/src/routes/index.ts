import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkinRouter from "./checkin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkinRouter);

export default router;
