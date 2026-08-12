import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import productsRouter from "./products.js";
import collectionsRouter from "./collections.js";
import ordersRouter from "./orders.js";
import newsletterRouter from "./newsletter.js";
import contactRouter from "./contact.js";
import paymentsRouter from "./payments.js";
import eventsRouter from "./events.js";
import automationsRouter from "./automations.js";
import authRouter from "./auth.js";
import segmentsRouter from "./segments.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(segmentsRouter);
router.use(productsRouter);
router.use(collectionsRouter);
router.use(ordersRouter);
router.use(newsletterRouter);
router.use(contactRouter);
router.use(paymentsRouter);
router.use(eventsRouter);
router.use(automationsRouter);
router.use(authRouter);

export default router;
