import z from "zod";

export const QuestionSchema = z
  .object({
    difficulty: z.enum(["easy", "medium", "hard"]),
    question_type: z.enum([
      "multiple_choice_questions",
      "fill_in_the_blanks",
      "short_question",
      "true_false",
    ]),
    question: z.string(),
  })
  .describe("Schema for a question");

export const ChoiceSchema = z.object({
  choice_text: z.string(),
});

export const AnswerSchema = z
  .object({
    answer: z.string(),
    explanation: z.string(),
  })
  .describe("Schema for an answer");

export const QuestionsSchema = z.array(
  z.object({
    question: QuestionSchema.describe(
      `if question type is
          fill_in_the_blanks : there should be a blank in the question.
          multiple_choice_questions : normal questions with question mark.
          short_question : question that can be answered in short number or words.
          true_false : This is a statement that can be either true or false.`,
    ),
    choices: z.array(ChoiceSchema).describe(
      `if question type is
          fill_in_the_blanks : every choices is an answer, generate max 3 and min 1 choice for Fill In the blanks..
          multiple_choice_questions : Just like normal MCQ there will be 1 correct answer and total 4 choices.
          short_question : choices array should be empty
          true_false : two choices, true or false`,
    ),
    answer: AnswerSchema.describe(
      `if question type is
          fill_in_the_blanks : no answer needed here, it should be empty.
          multiple_choice_questions : One correct answer from the choices, only mention the correct choice text,
          short_question : a short answer to the corresponding question,
          true_false : true or false`,
    ),
  }),
);

export const LlmExpectedResponseSchema = z.object({
  title: z.string().describe("Title of this set of questions"),
  questions: QuestionsSchema,
});
export type ExpectedLlmResponse = z.infer<typeof LlmExpectedResponseSchema>;
