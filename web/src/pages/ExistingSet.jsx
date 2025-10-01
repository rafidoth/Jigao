import { useMemo } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Badge,
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
  Code,
  Callout,
  Switch,
} from "@radix-ui/themes";
import { CheckCircledIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import useExistingSetStore from "../store/existingSetStore.js";
import QuestionCard from "../components/question_card.jsx";

const getQuestions = async (set_id) => {
  const res = await fetch(
    `http://localhost:9999/api/v1/questions?set_id=${set_id}`,
  );
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};

function ExistingSet() {
  const { set_id } = useParams();
  const {
    data: questions,
    isError,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["questions", set_id],
    queryFn: () => getQuestions(set_id),
  });
  // query the set title
  // query the set context

  const items = useMemo(() => questions || [], [questions]);
  const showAnswer = useExistingSetStore((state) => state.showAnswer);
  const toggleShowAnswer = useExistingSetStore(
    (state) => state.toggleShowAnswer,
  );
  console.log(showAnswer);
  if (isLoading)
    return (
      <Container size="3" p={{ initial: "4", md: "6" }}>
        <Card size="3">
          <Flex align="center" gap="3">
            <InfoCircledIcon />
            <Text>Loading questions…</Text>
          </Flex>
        </Card>
      </Container>
    );

  if (isError)
    return (
      <Container size="3" p={{ initial: "4", md: "6" }}>
        <Callout.Root color="ruby">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Error loading questions{error?.message ? `: ${error.message}` : ""}
          </Callout.Text>
        </Callout.Root>
      </Container>
    );

  return (
    <Container size="4" p={{ initial: "4", md: "6" }}>
      <Flex direction="column" gap="4">
        <Flex align="baseline" justify="between" wrap="wrap" gap="3">
          <Heading size="6">Question Set</Heading>
          <Text as="label" size="3">
            <Flex gap="2">
              <Switch
                size="1"
                checked={showAnswer}
                onCheckedChange={() => toggleShowAnswer()}
              />{" "}
              Show Answers
            </Flex>
          </Text>
          <Badge variant="soft" color="indigo">
            {items.length} questions
          </Badge>
        </Flex>

        <Flex direction="column" gap="3">
          {items.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}

          {items.length === 0 && (
            <Card size="3">
              <Text color="gray">No questions in this set yet.</Text>
            </Card>
          )}
        </Flex>
      </Flex>
    </Container>
  );
}

export default ExistingSet;
