import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import collectionsRouter from "./collections";
import ordersRouter from "./orders";
import newsletterRouter from "./newsletter";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(collectionsRouter);
router.use(ordersRouter);
router.use(newsletterRouter);
router.use(contactRouter);

export default router;
