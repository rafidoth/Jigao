import { Card, Flex, Heading, Badge, Box, Text } from "@radix-ui/themes";
import { typeLabel, difficultyColor } from "./CardUtils";
import styles from "./TrueFalseCard.module.css";
import { CheckCircledIcon } from "@radix-ui/react-icons";
function TrueFalseCard({
  question: q,
  position,
  showAnswer,
  selected,
  selectAnswer,
}) {
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
                const isSelected = selected === c;
                const choiceClassName = `${styles.choice} ${
                  isSelected ? styles.choiceSelected : ""
                }`;

                return (
                  <Flex
                    key={`${q.id}-choice-${idx}`}
                    align="center"
                    gap="2"
                    className={choiceClassName}
                    onClick={() => selectAnswer(q.id, c)}
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

export default TrueFalseCard;
