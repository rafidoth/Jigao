import { Card, Flex, Heading, Badge, Box, Text } from "@radix-ui/themes";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import useExistingSetStore from "../store/existingSetStore.js";

function difficultyColor(d) {
  const key = String(d || "").toLowerCase();
  if (key === "easy") return "green";
  if (key === "medium") return "amber";
  if (key === "hard") return "ruby";
  return "gray";
}

function typeLabel(t) {
  return String(t || "")
    .replaceAll("_", " ")
    .replace(/^\w|\s\w/g, (m) => m.toUpperCase());
}

// TODO: all different question types should have their own components
//

function McqCard({ question: q, showAnswer, position }) {
  return (
    <Card key={q.id} variant="surface">
      <Flex direction="column" gap="3">
        <Flex direction="column" align="start" gap="3">
          <Flex align="center" gap="2">
            <Badge variant="soft" color={difficultyColor(q.difficulty)}>
              {typeLabel(q.difficulty)}
            </Badge>
            <Badge variant="soft" color="gray">
              {typeLabel(q.type)}
            </Badge>
          </Flex>
          <Heading size="4" wrap="balance">
            {position}. {q.text}
          </Heading>
        </Flex>

        <Box>
          <Box mt="2">
            <Flex direction="column" gap="2">
              {q.choices?.map((c, idx) => {
                const isAnswer = idx === q.answerIdx;
                return (
                  <Flex
                    key={`${q.id}-choice-${idx}`}
                    align="center"
                    gap="2"
                    px="3"
                    py="2"
                    style={{
                      borderRadius: "12px",
                      background:
                        showAnswer && isAnswer
                          ? "var(--accent-3)"
                          : "var(--gray-2)",
                      border:
                        showAnswer && isAnswer
                          ? "1px solid var(--accent-7)"
                          : "1px solid var(--gray-5)",
                    }}
                  >
                    {showAnswer && isAnswer ? (
                      <Badge color="teal" variant="solid">
                        <Flex align="center" gap="1">
                          <CheckCircledIcon /> Correct
                        </Flex>
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="soft">
                        {String.fromCharCode(65 + idx)}
                      </Badge>
                    )}
                    <Text>{c}</Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Box>

        {showAnswer && q.explanation ? (
          <Box>
            <Text weight="bold">Explanation</Text>
            <Card mt="2" variant="classic">
              <Text color="gray">{q.explanation}</Text>
            </Card>
          </Box>
        ) : null}
      </Flex>
    </Card>
  );
}

function ShortAnswerCard({ question: q, position, showAnswer }) {
  return (
    <Card key={q.id} variant="surface">
      <Flex direction="column" gap="3">
        <Flex direction="column" align="start" gap="3">
          <Flex align="center" gap="2">
            <Badge variant="soft" color={difficultyColor(q.difficulty)}>
              {typeLabel(q.difficulty)}
            </Badge>
            <Badge variant="soft" color="gray">
              {typeLabel(q.type)}
            </Badge>
          </Flex>
          <Heading size="4" wrap="balance">
            {position}. {q.text}
          </Heading>
        </Flex>

        {q.type === "short_question" && showAnswer && (
          <Flex direction="column" gap="2">
            {q.answerText ? (
              <Card mt="2" variant="classic">
                <Text color="gray">{q.answerText}</Text>
              </Card>
            ) : (
              <Card mt="2" variant="classic">
                <Text color="gray">No answer provided.</Text>
              </Card>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

function FillInTheBlanksCard({ question: q, position, showAnswer }) {
  return (
    <Card key={q.id} variant="surface">
      <Flex direction="column" gap="3">
        <Flex direction="column" align="start" gap="3">
          <Flex align="center" gap="2">
            <Badge variant="soft" color={difficultyColor(q.difficulty)}>
              {typeLabel(q.difficulty)}
            </Badge>
            <Badge variant="soft" color="gray">
              {typeLabel(q.type)}
            </Badge>
          </Flex>
          <Heading size="4" wrap="balance">
            {position}. {q.text}
          </Heading>
        </Flex>

        {showAnswer && (
          <Box>
            <Text weight="bold">Answer</Text>
            <Flex direction="column" gap="2">
              {q.choices?.map((c, idx) => {
                const isAnswer = idx === q.answerIdx;
                return (
                  <Flex
                    key={`${q.id}-choice-${idx}`}
                    align="center"
                    gap="2"
                    px="3"
                    py="2"
                    style={{
                      borderRadius: "12px",
                      background: "var(--accent-3)",
                      border: "1px solid var(--accent-7)",
                    }}
                  >
                    <Badge color="teal" variant="solid">
                      <Flex align="center" gap="1">
                        <CheckCircledIcon /> Correct
                      </Flex>
                    </Badge>
                    <Text>{c}</Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        )}

        {showAnswer && q.explanation ? (
          <Box>
            <Text weight="bold">Explanation</Text>
            <Card mt="2" variant="classic">
              <Text color="gray">{q.explanation}</Text>
            </Card>
          </Box>
        ) : null}
      </Flex>
    </Card>
  );
}

function TrueFalseCard({ question: q, position, showAnswer }) {
  return (
    <Card key={q.id} variant="surface">
      <Flex direction="column" gap="3">
        <Flex direction="column" align="start" gap="3">
          <Flex align="center" gap="2">
            <Badge variant="soft" color={difficultyColor(q.difficulty)}>
              {typeLabel(q.difficulty)}
            </Badge>
            <Badge variant="soft" color="gray">
              {typeLabel(q.type)}
            </Badge>
          </Flex>
          <Heading size="4" wrap="balance">
            {position}. {q.text}
          </Heading>
        </Flex>

        <Box>
          <Box mt="2">
            <Flex direction="column" gap="2">
              {q.choices?.map((c, idx) => {
                const isAnswer = idx === q.answerIdx;
                return (
                  <Flex
                    key={`${q.id}-choice-${idx}`}
                    align="center"
                    gap="2"
                    px="3"
                    py="2"
                    style={{
                      borderRadius: "12px",
                      background:
                        showAnswer && isAnswer
                          ? "var(--accent-3)"
                          : "var(--gray-2)",
                      border:
                        showAnswer && isAnswer
                          ? "1px solid var(--accent-7)"
                          : "1px solid var(--gray-5)",
                    }}
                  >
                    {showAnswer && isAnswer ? (
                      <Badge color="teal" variant="solid">
                        <Flex align="center" gap="1">
                          <CheckCircledIcon /> Correct
                        </Flex>
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="soft">
                        {String.fromCharCode(65 + idx)}
                      </Badge>
                    )}
                    <Text>{c}</Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Box>

        {showAnswer && q.explanation ? (
          <Box>
            <Text weight="bold">Explanation</Text>
            <Card mt="2" variant="classic">
              <Text color="gray">{q.explanation}</Text>
            </Card>
          </Box>
        ) : null}
      </Flex>
    </Card>
  );
}

function QuestionCard({ question: q, position }) {
  const showAnswer = useExistingSetStore((state) => state.showAnswer);
  // console.log(q.type);
  switch (q.type) {
    case "multiple_choice_questions":
      return (
        <McqCard question={q} showAnswer={showAnswer} position={position} />
      );
    case "short_question":
      return (
        <ShortAnswerCard
          question={q}
          showAnswer={showAnswer}
          position={position}
        />
      );
    case "fill_in_the_blanks":
      return (
        <FillInTheBlanksCard
          question={q}
          showAnswer={showAnswer}
          position={position}
        />
      );
    case "true_false":
      return (
        <TrueFalseCard
          question={q}
          showAnswer={showAnswer}
          position={position}
        />
      );
  }
}
export default QuestionCard;
