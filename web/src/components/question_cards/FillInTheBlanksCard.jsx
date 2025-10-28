import {
  Card,
  Flex,
  Heading,
  Badge,
  Box,
  Text,
  TextField,
} from "@radix-ui/themes";

import { useState } from "react";
import { typeLabel, difficultyColor } from "./CardUtils.js";
import { CheckCircledIcon } from "@radix-ui/react-icons";

function FillInTheBlanksCard({
  question: q,
  position,
  showAnswer,
  selected,
  selectAnswer,
}) {
  console.log(selected);
  const isCorrect = q.choices.some((choice) => choice === selected);
  const isEmpty = selected === "";
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

        <TextField.Root
          radius={"medium"}
          placeholder="Write your answer…"
          value={selected}
          onChange={(e) => selectAnswer(q.id, e.target.value)}
          style={{
            background: isCorrect
              ? "var(--accent-3)"
              : isEmpty
                ? ""
                : "var(--red-a3)",
            border: isCorrect
              ? "1px solid var(--accent-7)"
              : isEmpty
                ? ""
                : "1px solid var(--red-a4)",
            outline: "none",
          }}
        ></TextField.Root>

        {showAnswer && (
          <Box>
            <Text weight="bold">Answer</Text>
            <Flex direction="column" gap="2">
              {q.choices?.map((c, idx) => {
                // const isAnswer = idx === q.answerIdx;
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
export default FillInTheBlanksCard;
