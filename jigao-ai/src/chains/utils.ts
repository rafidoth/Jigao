export const getDifficultyInstructions = (difficulty: string): string => {
  const rules = {
    easy: `
- Test direct recall and recognition
- One clear concept per question
- No tricky distractors
- Straightforward language
Example: "What is X?" not "How might X relate to Y under Z conditions?"
`,
    medium: `
- Test application and reasoning
- Require elimination of plausible wrong answers
- Connect 2 concepts
- Include one "almost correct" distractor
Example: "Given X, what happens to Y?" not just "What is X?"
`,
    hard: `
- Test synthesis across multiple concepts
- All distractors should seem correct to someone who half-understands
- Require rejecting subtle misconceptions
- Multi-step reasoning needed
Example: "Why does X fail when Y, despite Z being true?"
`,
  };
  return rules[difficulty as keyof typeof rules] || rules.medium;
};
