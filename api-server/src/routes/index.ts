import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quizQuestionsRouter from "./quiz-questions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quizQuestionsRouter);

export default router;
