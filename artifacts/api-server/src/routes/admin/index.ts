import { Router, type IRouter } from "express";
import adminAuthRouter      from "./auth.js";
import adminTenantsRouter   from "./tenants.js";
import adminStatsRouter     from "./stats.js";
import adminPaymentsRouter  from "./payments.js";
import adminQueuesRouter    from "./queues.js";
import adminPlansRouter     from "./plans.js";
import adminProvidersRouter from "./providers.js";

const adminRouter: IRouter = Router();

adminRouter.use(adminAuthRouter);
adminRouter.use(adminTenantsRouter);
adminRouter.use(adminStatsRouter);
adminRouter.use(adminPaymentsRouter);
adminRouter.use(adminQueuesRouter);
adminRouter.use(adminPlansRouter);
adminRouter.use(adminProvidersRouter);

export default adminRouter;
