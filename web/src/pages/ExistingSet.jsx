import { useParams } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import axios from "axios";
import {
  Badge,
  Card,
  Container,
  Flex,
  Heading,
  Text,
  Callout,
  Switch,
  IconButton,
  Popover,
  Box,
  TextArea,
  TextField,
  ScrollArea,
  Grid,
} from "@radix-ui/themes";

import {
  GlobeIcon,
  LockClosedIcon,
  EyeOpenIcon,
  InfoCircledIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import useExistingSetStore from "../store/existingSetStore.js";
import QuestionCard from "../components/question_card.jsx";

import CreateNewQuestionPopover from "../components/create_new_question_popover.jsx";

const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case "public":
      return <GlobeIcon />;
    case "private":
      return <LockClosedIcon />;
    case "restricted":
      return <EyeOpenIcon />;
    default:
      return null;
  }
};

function ExistingSetHeader({ set, itemsLength, showAnswer, toggleShowAnswer }) {
  return (
    <Flex align="baseline" justify="between" wrap="wrap" gap="3">
      <Flex align="center" gap="2">
        <Heading size="6">{set.title}</Heading>
        <Flex align="center" justify="center">
          {getVisibilityIcon(set.visibility)}
        </Flex>
      </Flex>

      <Text as="label" size="3">
        <Flex gap="2" align="center">
          <Switch
            size="1"
            checked={showAnswer}
            onCheckedChange={toggleShowAnswer}
            variant="classic"
          />
          Show Answers
        </Flex>
      </Text>

      <Flex align="center" gap="2">
        <CreateNewQuestionPopover set_id={set.id}>
          <IconButton variant="soft" color="teal">
            <PlusIcon />
          </IconButton>
        </CreateNewQuestionPopover>
        <Badge variant="soft" color="teal">
          {itemsLength} questions
        </Badge>
      </Flex>
    </Flex>
  );
}

function QuestionsList({ items }) {
  return (
    <ScrollArea
      type="hover"
      style={{ height: "calc(100vh - 100px)" }}
      scrollbars="vertical"
    >
      <Grid
        gap="3"
        columns={{ initial: "1", sm: "2", md: "3", lg: "4", xl: "5" }}
        align="baseline"
        pr="3"
      >
        {items.map((q, i) => (
          <QuestionCard key={q.id} question={q} position={i + 1} />
        ))}

        {items.length === 0 && (
          <Card size="3">
            <Text color="gray">No questions in this set yet.</Text>
          </Card>
        )}
      </Grid>
    </ScrollArea>
  );
}

const getQuestions = async (set_id) => {
  const res = await axios.get(
    `http://localhost:9999/api/v1/questions?set_id=${set_id}`,
  );
  return res.data;
};

const getSet = async (set_id) => {
  const res = await axios.get(`http://localhost:9999/api/v1/sets/${set_id}`);
  return res.data;
};

function ExistingSet() {
  const { set_id } = useParams();

  const results = useQueries({
    queries: [
      { queryKey: ["set", set_id], queryFn: () => getSet(set_id) },
      { queryKey: ["questions", set_id], queryFn: () => getQuestions(set_id) },
    ],
  });

  const {
    data: set,
    isLoading: isSetLoading,
    isError: isSetError,
    error: setError,
  } = results[0];

  const {
    data: questions,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
    error: questionsError,
  } = results[1];

  const items = useMemo(() => questions || [], [questions]);
  const showAnswer = useExistingSetStore((state) => state.showAnswer);
  const toggleShowAnswer = useExistingSetStore(
    (state) => state.toggleShowAnswer,
  );

  if (isSetLoading || isQuestionsLoading) {
    return <LoadingExistingSet />;
  }

  if (isSetError || isQuestionsError) {
    const message = setError?.message || questionsError?.message || "";
    return <ErrorExistingSet message={message} />;
  }

  return (
    <Flex direction="row" flex="1" p="6" gap="4" justify="center">
      <Flex direction="column" gap="4">
        <ExistingSetHeader
          set={set}
          itemsLength={items.length}
          showAnswer={showAnswer}
          toggleShowAnswer={toggleShowAnswer}
        />
        <QuestionsList items={items} />
      </Flex>
    </Flex>
  );
}

function LoadingExistingSet() {
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
}

function ErrorExistingSet({ message }) {
  return (
    <Container size="3" p={{ initial: "4", md: "6" }}>
      <Callout.Root color="ruby">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Error loading questions{message ? `: ${message}` : ""}
        </Callout.Text>
      </Callout.Root>
    </Container>
  );
}

export default ExistingSet;
