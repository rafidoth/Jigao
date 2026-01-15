import z from "zod";

export const QuestionSchema = z
  .object({
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .describe("The difficulty level of the question: easy, medium, or hard"),
    question_type: z
      .enum([
        "multiple_choice_questions",
        "fill_in_the_blanks",
        "short_question",
        "true_false",
      ])
      .describe("The type of question being generated"),
    question: z.string().describe(
      `The question text. Follow these rules based on question_type:
      
      fill_in_the_blanks:
        - Single, unambiguous answer
        - Blank tests the KEY concept, not trivial details
        - Provide the complete sentence with _____ for the blank
        - Answer should be 1-3 words
        
      multiple_choice_questions:
        - Normal questions with question mark
        - It will have exactly 4 options (A, B, C, D)
        - Only ONE correct answer
        - Distractors must be plausible but clearly wrong when analyzed
        - All options same grammatical structure
        - No "all of the above" or "none of the above"
        
      short_question:
        - Answerable in 2-4 sentences
        - Use specific verbs: "explain why", "describe how", "compare"
        - NOT vague verbs like "discuss" or "comment on"
        - Should force understanding, not memorization
        
      true_false:
        - Statement must be completely true or completely false
        - No "partially true" statements
        - Avoid absolute words (always, never) unless factually accurate
        - For hard difficulty, make false statements subtly wrong`,
    ),
  })
  .describe(
    "Schema for a question containing difficulty, type, and question text",
  );

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
      "Schema for a question containing difficulty, type, and question text",
    ),
    choices: z.array(ChoiceSchema).describe(
      `Array of answer choices. Requirements by question type:
            MCQ (multiple_choice_questions):
            - MUST contain exactly 4 choices
            - Only 1 choice is correct, 3 are distractors
            - All choices must be plausible and similar in length/structure
            - Label choices as A, B, C, D

            Fill in the Blanks (fill_in_the_blanks):
            - Generate 1-3 acceptable answers (synonyms or equivalent phrasings)
            - Each choice represents a valid answer for the blank
            - Order from most common to least common answer

            True/False (true_false):
            - MUST contain exactly 2 choices: ["True", "False"]
            - Use exactly these labels, capitalized

            Short Answer (short_question):
            - MUST be an empty array []
            - No choices needed for open-ended questions`,
    ),
    answer: AnswerSchema.describe(
      `The correct answer or expected response. Format by question type:
            MCQ (multiple_choice_questions):
            - Provide the EXACT text of the correct choice
            - Must match one of the 4 choices verbatim
            - Example: If choice B is correct, return the full text of choice B

            Fill in the Blanks (fill_in_the_blanks):
            - MUST be an empty string ""
            - Answers are already provided in the choices array

            True/False (true_false):
            - Return either "True" or "False" (capitalized)
            - Must match one of the two choices exactly

            Short Answer (short_question):
            - Provide a model answer in 2-4 complete sentences
            - Answer should demonstrate expected depth and key concepts
            - Use specific, clear language that students can compare against`,
    ),
  }),
);

export const LlmExpectedResponseSchema = z.object({
  title: z.string().describe(`
Generate a concise, specific, and informative title for a set of questions.

Requirements:
    - 5–8 words.
    - Accurately reflect the shared concept, skill, or insight of all questions in the set.
    - Avoid vague terms (e.g., “miscellaneous,” “various,” “questions”).
    - Avoid punctuation and filler.
    - Prefer concrete nouns and action-oriented phrasing.
    - Do not include numbering, formatting, or explanations.`),
  questions: QuestionsSchema,
});

export type ExpectedLlmResponse = z.infer<typeof LlmExpectedResponseSchema>;
