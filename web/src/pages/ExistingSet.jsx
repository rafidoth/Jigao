import { useParams } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { GearIcon } from "@radix-ui/react-icons";
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
  Tooltip,
  Tabs,
  Button,
} from "@radix-ui/themes";

import {
  GlobeIcon,
  LockClosedIcon,
  EyeOpenIcon,
  InfoCircledIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import useExistingSetStore from "../store/existingSetStore.js";
import QuestionCard from "../components/question_cards/question_card.jsx";

import CreateNewQuestionPopover from "../components/create_new_question_popover.jsx";
import ExamsDialog from "../components/exams_dialog.jsx";
import { useState } from "react";
import SetSettingsUpdatePopover from "../components/set_settings_update_popover.jsx";

const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case "public":
      return <GlobeIcon style={{ height: "20px", width: "20px" }} />;
    case "private":
      return <LockClosedIcon style={{ height: "20px", width: "20px" }} />;
    case "restricted":
      return <EyeOpenIcon style={{ height: "20px", width: "20px" }} />;
    default:
      return null;
  }
};

function ExistingSetHeader({ set, itemsLength, showAnswer, toggleShowAnswer }) {
  return (
    <Flex align="baseline" justify="between" wrap="wrap" gap="3">
      <Flex align="center" gap="2">
        <Heading size="6">{set.title}</Heading>
        <Flex align={"center"} gap={"2"}>
          <Flex align="center" justify="center">
            {getVisibilityIcon(set.visibility)}
          </Flex>
          <SetSettingsUpdatePopover set={set}>
            <IconButton variant="ghost">
              <GearIcon style={{ height: "20px", width: "20px" }} />
            </IconButton>
          </SetSettingsUpdatePopover>
          <ExamsDialog set_id={set.id}>
            <Button variant={"soft"}>Manage Exams</Button>
          </ExamsDialog>
        </Flex>
      </Flex>

      <Flex align="center" gap="2">
        <Tooltip content="Toggle Show Answer" side="top">
          <Switch
            size="1"
            checked={showAnswer}
            onCheckedChange={toggleShowAnswer}
            variant="soft"
            color="teal"
          />
        </Tooltip>

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

function ExistingSetHeaderMobile({
  set,
  itemsLength,
  showAnswer,
  toggleShowAnswer,
}) {
  return (
    <Flex align="baseline" justify="center" wrap="wrap" gap="3" pt={"3"}>
      <Flex direction="column" align="center" gap="2">
        <Heading size="4" style={{ textAlign: "center" }}>
          {set.title}
        </Heading>
      </Flex>
      <Flex align="center" justify={"between"} gap={"4"}>
        <Flex align={"center"} gap={"2"}>
          <Flex align="center" justify="center">
            {getVisibilityIcon(set.visibility)}
          </Flex>
          <SetSettingsUpdatePopover set={set}>
            <IconButton variant="ghost">
              <GearIcon style={{ height: "20px", width: "20px" }} />
            </IconButton>
          </SetSettingsUpdatePopover>
          <ExamsDialog set_id={set.id}>
            <Button variant={"soft"}>Manage Exams</Button>
          </ExamsDialog>
        </Flex>

        <Flex align="center" gap="2">
          <Tooltip content="Toggle Show Answer" side="top">
            <Switch
              size="1"
              checked={showAnswer}
              onCheckedChange={toggleShowAnswer}
              variant="soft"
              color="teal"
            />
          </Tooltip>

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
    </Flex>
  );
}

function QuestionsList({ items }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const handleSelectingAnswer = (qId, ans) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: ans,
    }));
  };

  return (
    <ScrollArea
      type="scroll"
      style={{ height: "calc(100vh - 100px)" }}
      scrollbars="vertical"
    >
      <Grid
        gap="3"
        columns={{ initial: "1", sm: "2", md: "3", lg: "4", xl: "5" }}
        align="baseline"
        px="3"
      >
        {items.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            position={i + 1}
            selected={selectedAnswers[q.id] || ""}
            selectAnswer={handleSelectingAnswer}
          />
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
  const res = await axios.get(`/api/v1/questions?set_id=${set_id}`);
  return res.data;
};

const getSet = async (set_id) => {
  const res = await axios.get(`/api/v1/sets/${set_id}`);
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
    <Flex direction="row" flex="1" gap="4" justify="center">
      <Flex direction="column" gap="4">
        <Box display={{ initial: "none", lg: "block" }}>
          <ExistingSetHeader
            set={set}
            itemsLength={items.length}
            showAnswer={showAnswer}
            toggleShowAnswer={toggleShowAnswer}
          />
        </Box>
        <Box display={{ initial: "block", lg: "none" }}>
          <ExistingSetHeaderMobile
            set={set}
            itemsLength={items.length}
            showAnswer={showAnswer}
            toggleShowAnswer={toggleShowAnswer}
          />
        </Box>

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
