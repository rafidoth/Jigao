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

function QuestionCard({ question: q }) {
  const showAnswer = useExistingSetStore((state) => state.showAnswer);
  return (
    <Card key={q.id} size="3" variant="surface">
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Heading size="4" wrap="balance">
            {q.position}. {q.text}
          </Heading>
          <Flex align="center" gap="2">
            <Badge variant="solid" color={difficultyColor(q.difficulty)}>
              {typeLabel(q.difficulty)}
            </Badge>
            <Badge variant="soft" color="gray">
              {typeLabel(q.type)}
            </Badge>
          </Flex>
        </Flex>

        <Box>
          <Text weight="bold">Choices</Text>
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
export default QuestionCard;
