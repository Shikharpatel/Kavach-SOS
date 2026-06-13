import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incidentsRouter from "./incidents";
import resourcesRouter from "./resources";
import sheltersRouter from "./shelters";
import rescueTeamsRouter from "./rescue_teams";
import routesPlanRouter from "./routes_plan";
import aiRouter from "./ai";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/incidents", incidentsRouter);
router.use("/resources", resourcesRouter);
router.use("/shelters", sheltersRouter);
router.use("/rescue-teams", rescueTeamsRouter);
router.use("/routes", routesPlanRouter);
router.use("/ai", aiRouter);
router.use("/analytics", analyticsRouter);

export default router;
