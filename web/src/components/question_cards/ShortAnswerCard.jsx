import { Card, Flex, Heading, Badge, Text, TextArea } from "@radix-ui/themes";
import { typeLabel, difficultyColor } from "./CardUtils.js";
import { CheckCircledIcon } from "@radix-ui/react-icons";
function ShortAnswerCard({
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
        <TextArea
          radius={"medium"}
          placeholder="Write your answer…"
          value={selected}
          onChange={(e) => selectAnswer(q.id, e.target.value)}
        ></TextArea>

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

export default ShortAnswerCard;
