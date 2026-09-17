import { Router, type IRouter } from "express";
import { db, quizQuestionsTable } from "@workspace/db";

type QuizAnswer = "O" | "X";
type QuizQuestionInput = {
  id: number;
  statement: string;
  answer: QuizAnswer;
  explanation: string;
};

const ADMIN_PASSWORD = "1472";
const router: IRouter = Router();

function isQuestion(value: unknown): value is QuizQuestionInput {
  if (!value || typeof value !== "object") return false;
  const question = value as Partial<QuizQuestionInput>;
  return Number.isInteger(question.id)
    && typeof question.statement === "string"
    && question.statement.trim().length > 0
    && (question.answer === "O" || question.answer === "X")
    && typeof question.explanation === "string"
    && question.explanation.trim().length > 0;
}

function readQuestions(value: unknown): QuizQuestionInput[] | null {
  if (!Array.isArray(value) || value.length !== 5 || !value.every(isQuestion)) return null;
  const ids = new Set(value.map(question => question.id));
  return ids.size === 5 ? value : null;
}

function isAdmin(req: { header(name: string): string | undefined }) {
  return req.header("x-admin-password") === ADMIN_PASSWORD;
}

router.get("/quiz-questions", async (_req, res) => {
  try {
    const rows = await db.select().from(quizQuestionsTable).orderBy(quizQuestionsTable.id);
    res.set("Cache-Control", "no-store");
    res.json({
      questions: rows.map(({ id, statement, answer, explanation }) => ({ id, statement, answer, explanation })),
    });
  } catch (error) {
    res.status(503).json({ message: "문항을 불러오지 못했습니다." });
  }
});

router.put("/quiz-questions", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ message: "관리자 인증이 필요합니다." });
    return;
  }

  const questions = readQuestions(req.body?.questions);
  if (!questions) {
    res.status(400).json({ message: "문항은 5개이며 형식이 올바라야 합니다." });
    return;
  }

  try {
    await db.transaction(async transaction => {
      await transaction.delete(quizQuestionsTable);
      await transaction.insert(quizQuestionsTable).values(questions);
    });
    res.set("Cache-Control", "no-store");
    res.json({ questions });
  } catch (error) {
    res.status(503).json({ message: "문항을 저장하지 못했습니다." });
  }
});

router.delete("/quiz-questions", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ message: "관리자 인증이 필요합니다." });
    return;
  }

  try {
    await db.delete(quizQuestionsTable);
    res.status(204).end();
  } catch (error) {
    res.status(503).json({ message: "문항을 초기화하지 못했습니다." });
  }
});

export default router;