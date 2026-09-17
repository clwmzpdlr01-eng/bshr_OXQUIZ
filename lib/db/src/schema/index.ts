import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const quizQuestionsTable = pgTable("quiz_questions", {
  id: integer("id").primaryKey(),
  statement: text("statement").notNull(),
  answer: varchar("answer", { length: 1 }).notNull(),
  explanation: text("explanation").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type QuizQuestionRecord = typeof quizQuestionsTable.$inferSelect;