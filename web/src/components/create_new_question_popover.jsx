import {
  Box,
  Popover,
  RadioCards,
  Flex,
  Heading,
  TextArea,
  TextField,
  Text,
  Grid,
  Button,
  RadioGroup,
  Badge,
  Code,
} from "@radix-ui/themes";

import { create } from "zustand";
import { useState } from "react";
import axios from "axios";
import { Toast } from "radix-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Root } from "@radix-ui/themes/components/alert-dialog";
import { rootDomain } from "../api/api";

const difficultyLevels = ["easy", "medium", "hard"];
const CreateNewQuestionStore = (set, get, store) => ({
  reset: () => {
    set(store.getInitialState());
  },
  difficulty: "easy",
  setDifficulty: (level) => set({ difficulty: level }),

  questionText: "",
  setQuestionText: (text) => set({ questionText: text }),

  questionType: "multiple_choice_questions",
  setQuestionType: (type) => set({ questionType: type }),

  mcq: {
    choices: ["", "", "", ""],
    correctAnswer: Math.floor(Math.random() * 4),
  },
  setChoice: (index, value) =>
    set((state) => {
      const newChoices = [...state.mcq.choices];
      newChoices[index] = value;
      return { mcq: { ...state.mcq, choices: newChoices } };
    }),
  setMcqCorrectAnswer: (index) =>
    set((state) => ({ mcq: { ...state.mcq, correctAnswer: index } })),

  trueFalse: {
    choices: ["True", "False"],
    correctAnswer: Math.floor(Math.random() * 2),
  },
  setTrueFalseCorrectAnswer: (index) =>
    set((state) => ({
      trueFalse: { ...state.trueFalse, correctAnswer: index },
    })),
  fillInTheBlanks: {
    correctAnswers: [],
  },
  setFillInTheBlanksAnswers: (answer) =>
    set((state) => ({
      fillInTheBlanks: {
        correctAnswers: [...state.fillInTheBlanks.correctAnswers, answer],
      },
    })),

  shortAnswer: {
    estimatedCorrectAnswer: "",
  },
  setShortAnswerEstimatedCorrectAnswer: (text) =>
    set((state) => ({
      shortAnswer: { ...state.shortAnswer, estimatedCorrectAnswer: text },
    })),

  answerExplanation: "",
  setAnswerExplanation: (text) => set({ answerExplanation: text }),
});

const useCreateNewQuestionStore = create(CreateNewQuestionStore);

const questionTypes = [
  {
    value: "multiple_choice_questions",
    label: "Multiple Choice",
    description: "There will be 4 options and 1 correct answer.",
  },
  {
    value: "true_false",
    label: "True / False",
    description: "There will be 2 options: True and False.",
  },
  {
    value: "short_question",
    label: "Short Question",
    description: "Participant will type a short text as answer.",
  },
  {
    value: "fill_in_the_blanks",
    label: "Fill in the Blank",
    description:
      "There should be a ___ in the question and one correct answer for that.",
  },
];

function DifficultyRadioGroup() {
  const difficulty = useCreateNewQuestionStore((state) => state.difficulty);
  const setDifficulty = useCreateNewQuestionStore(
    (state) => state.setDifficulty,
  );

  return (
    <Box maxWidth="400px">
      <RadioCards.Root
        defaultValue={questionTypes[0].value}
        columns={{ initial: "3" }}
        value={difficulty}
        onValueChange={setDifficulty}
      >
        {difficultyLevels.map((level) => (
          <RadioCards.Item value={level} key={level}>
            <Badge
              variant="soft"
              color={
                level === "easy"
                  ? "green"
                  : level === "medium"
                    ? "yellow"
                    : "red"
              }
            >
              {level === "easy"
                ? "E"
                : level === "medium"
                  ? "M"
                  : level === "hard"
                    ? "H"
                    : ""}
            </Badge>
            <Text>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
          </RadioCards.Item>
        ))}
      </RadioCards.Root>
    </Box>
  );
}

function QuestionChoiceRadioGroup() {
  const questionType = useCreateNewQuestionStore((state) => state.questionType);
  const setQuestionType = useCreateNewQuestionStore(
    (state) => state.setQuestionType,
  );
  return (
    <Box maxWidth="600px">
      <RadioCards.Root
        defaultValue={questionTypes[0].value}
        columns={{ initial: "1", sm: "2" }}
        value={questionType}
        onValueChange={setQuestionType}
      >
        {questionTypes.map((type) => (
          <RadioCards.Item value={type.value} key={type.value}>
            <Flex direction="column" width="100%">
              <Text weight="bold">{type.label}</Text>
              <Text color="gray">{type.description}</Text>
            </Flex>
          </RadioCards.Item>
        ))}
      </RadioCards.Root>
    </Box>
  );
}

function MCQInputs() {
  const choices = useCreateNewQuestionStore((state) => state.mcq.choices);
  const correctAnswer = useCreateNewQuestionStore(
    (state) => state.mcq.correctAnswer,
  );
  const setChoice = useCreateNewQuestionStore((state) => state.setChoice);
  const setMcqCorrectAnswer = useCreateNewQuestionStore(
    (state) => state.setMcqCorrectAnswer,
  );

  const questionText = useCreateNewQuestionStore((state) => state.questionText);
  const setQuestionText = useCreateNewQuestionStore(
    (state) => state.setQuestionText,
  );

  return (
    <Flex direction="column" gap="3" width="100%">
      <TextArea
        placeholder="Enter question text"
        radius="large"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      ></TextArea>
      <Grid columns={{ initial: "1", md: "2" }} gap="3" width="auto">
        {choices.map((choice, index) => (
          <Box key={index}>
            <TextField.Root
              placeholder={`Choice ${index + 1} Text`}
              radius="medium"
              value={choice}
              onChange={(e) => setChoice(index, e.target.value)}
              variant={correctAnswer === index ? "soft" : "classic"}
            >
              <TextField.Slot
                onClick={() => setMcqCorrectAnswer(index)}
                px="3"
                radius="medium"
              >
                <Button variant="ghost" size="1">
                  C{index + 1}
                </Button>
              </TextField.Slot>
            </TextField.Root>
          </Box>
        ))}
      </Grid>
    </Flex>
  );
}

function TrueFalseInputs() {
  const choices = useCreateNewQuestionStore((state) => state.trueFalse.choices);
  const correctAnswer = useCreateNewQuestionStore(
    (state) => state.trueFalse.correctAnswer,
  );
  const setTrueFalseCorrectAnswer = useCreateNewQuestionStore(
    (state) => state.setTrueFalseCorrectAnswer,
  );

  // const questionText = useCreateNewQuestionStore((state) => state.questionText);
  const setQuestionText = useCreateNewQuestionStore(
    (state) => state.setQuestionText,
  );

  return (
    <Flex direction="column" gap="3" width="100%">
      <TextArea
        placeholder="Enter the statement"
        radius="large"
        onChange={(e) => setQuestionText(e.target.value)}
      ></TextArea>
      <Grid columns={{ initial: "1", md: "2" }} gap="3" width="auto">
        {choices.map((choice, index) => (
          <Box key={index}>
            <TextField.Root
              placeholder={`Choice ${index + 1} Text`}
              radius="medium"
              value={choice}
              variant={correctAnswer === index ? "soft" : "classic"}
            >
              <TextField.Slot
                onClick={() => setTrueFalseCorrectAnswer(index)}
                px="3"
                radius="medium"
              >
                <Button variant="ghost" size="1">
                  {choice[0]}
                </Button>
              </TextField.Slot>
            </TextField.Root>
          </Box>
        ))}
      </Grid>
    </Flex>
  );
}

function FillInTheBlanksInputs() {
  const correctAnswers = useCreateNewQuestionStore(
    (state) => state.fillInTheBlanks.correctAnswers,
  );
  const [current, SetCurrent] = useState("");
  const [error, setError] = useState("");

  const setFillInTheBlanksAnswers = useCreateNewQuestionStore(
    (state) => state.setFillInTheBlanksAnswers,
  );

  // const questionText = useCreateNewQuestionStore((state) => state.questionText);
  const setQuestionText = useCreateNewQuestionStore(
    (state) => state.setQuestionText,
  );

  const handleAddAnswer = () => {
    if (current.trim() === "") {
      setError("Answer cannot be empty");
      return;
    }
    if (correctAnswers.includes(current.trim())) {
      setError("Answer already exists");
      return;
    }
    if (correctAnswers.length >= 8) {
      setError("Maximum of 8 answers allowed");
      return;
    }

    setFillInTheBlanksAnswers(current.trim());
    SetCurrent("");
    setError("");
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleAddAnswer();
    }
  };

  return (
    <Flex direction="column" gap="3" width="100%">
      <TextArea
        placeholder="Enter the statement"
        radius="large"
        onChange={(e) => setQuestionText(e.target.value)}
      ></TextArea>
      {correctAnswers.length > 0 && (
        <Flex gap="2">
          {correctAnswers.map((answer, index) => (
            <Badge variant="soft" color="teal" radius="medium" key={index}>
              <Text key={index}>{answer}</Text>
            </Badge>
          ))}
        </Flex>
      )}

      <TextField.Root
        placeholder="Add a correct answer"
        radius="medium"
        value={current}
        onChange={(e) => SetCurrent(e.target.value)}
        onKeyPress={handleKeyPress}
      ></TextField.Root>

      <Button radius="large" variant="soft" onClick={handleAddAnswer}>
        Add Answer{" "}
        <Code color="teal" variant="soft">
          Enter
        </Code>
      </Button>
      <Text color="red">{error}</Text>
    </Flex>
  );
}

function ShortAnswerInputs() {
  const estimatedCorrectAnswer = useCreateNewQuestionStore(
    (state) => state.shortAnswer.estimatedCorrectAnswer,
  );
  const questionText = useCreateNewQuestionStore((state) => state.questionText);
  const setQuestionText = useCreateNewQuestionStore(
    (state) => state.setQuestionText,
  );
  const setShortAnswerEstimatedCorrectAnswer = useCreateNewQuestionStore(
    (state) => state.setShortAnswerEstimatedCorrectAnswer,
  );
  return (
    <Flex direction="column" gap="3" width="100%">
      <TextArea
        placeholder="Enter question text"
        radius="large"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      ></TextArea>
      <TextArea
        placeholder="Enter the estimated correct answer"
        radius="large"
        value={estimatedCorrectAnswer}
        onChange={(e) => setShortAnswerEstimatedCorrectAnswer(e.target.value)}
      ></TextArea>
    </Flex>
  );
}

function getChoicesBasedOnQuestionType(questionType, state) {
  switch (questionType) {
    case "multiple_choice_questions":
      return state.mcq.choices;
    case "true_false":
      return state.trueFalse.choices;
    case "short_question":
      return [];
    case "fill_in_the_blanks":
      return state.fillInTheBlanks.correctAnswers;
    default:
      return [];
  }
}

function getCorrectAnswerBasedOnQuestionType(questionType, state) {
  // console.log("state", state.mcq.correctAnswer);
  // console.log("state", state.mcq.choices);
  switch (questionType) {
    case "multiple_choice_questions":
      return state.mcq.choices[state.mcq.correctAnswer];
    case "true_false":
      return state.trueFalse.choices[state.trueFalse.correctAnswer];
    case "short_question":
      return state.shortAnswer.estimatedCorrectAnswer;
    case "fill_in_the_blanks":
      return state.fillInTheBlanks.correctAnswers.join(",");
    default:
      return null;
  }
}

function validateInputs(
  difficulty,
  questionType,
  questionText,
  choices,
  correctAnswer,
) {
  let error = "";
  if (!questionText || questionText.trim() === "") {
    error = "Question text cannot be empty";
  }
  if (questionType === "multiple_choice_questions") {
    if (choices.length < 4 || choices.some((c) => c.trim() === "")) {
      error = "All 4 choices must be filled out";
    }
    if (correctAnswer < 0 || correctAnswer > 3) {
      error = "A correct answer must be selected";
    }
  }
  if (questionType === "true_false") {
    if (correctAnswer < 0 || correctAnswer > 1) {
      error = "A correct answer must be selected";
    }
  }
  if (questionType === "fill_in_the_blanks") {
    if (choices.length === 0) {
      error = "At least one correct answer must be added";
    }
  }
  // if (questionType === "short_question") {
  //   if (!correctAnswer || correctAnswer.trim() === "") {
  //     error = "Estimated correct answer cannot be empty";
  //   }
  // }
  const isError = error !== "";
  return { error, isError };
}

async function createNewQuestionApiPost(variables) {
  const {
    set_id,
    difficulty,
    questionType,
    questionText,
    choices,
    correctAnswer,
    explanation,
  } = variables;
  const body = {
    question: {
      difficulty: difficulty,
      question_type: questionType,
      question: questionText,
    },
    choices: choices.map((c) => ({ choice_text: c.trim() })),
    answer: {
      answer: correctAnswer,
      explanation: explanation,
    },
  };
  console.log("body", body);
  const res = await axios.post(
    `${rootDomain}/api/v1/questions?set_id=${set_id}`,
    body,
  );
  return res.data;
}

function CreateNewQuestionPopover({ children, set_id }) {
  const difficulty = useCreateNewQuestionStore((state) => state.difficulty);
  const questionType = useCreateNewQuestionStore((state) => state.questionType);
  const questionText = useCreateNewQuestionStore((state) => state.questionText);

  const state = useCreateNewQuestionStore();
  const choices = getChoicesBasedOnQuestionType(questionType, state);
  const correctAnswer = getCorrectAnswerBasedOnQuestionType(
    questionType,
    state,
  );
  const explanation = useCreateNewQuestionStore(
    (state) => state.answerExplanation,
  );
  const [error, setError] = useState("");

  let inputs = null;
  switch (questionType) {
    case "multiple_choice_questions":
      inputs = <MCQInputs />;
      break;
    case "true_false":
      inputs = <TrueFalseInputs />;
      break;
    case "short_question":
      inputs = <ShortAnswerInputs />;
      break;
    case "fill_in_the_blanks":
      inputs = <FillInTheBlanksInputs />;
      break;
    default:
      break;
  }
  const resetStates = useCreateNewQuestionStore((state) => state.reset);
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: createNewQuestionApiPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", set_id] });
      setError("");
      resetStates();
      console.log("Question created successfully");
    },
    onError: (error) => {
      console.log("Error creating question:", error);
      setError("Failed to create question. Please try again.");
    },
  });

  const handleCreateQuestion = async () => {
    const { error, isError } = validateInputs(
      difficulty,
      questionType,
      questionText,
      choices,
      correctAnswer,
      explanation,
    );
    // console.log("df Error", error, isError);
    // console.log(correctAnswer);
    if (isError) {
      setError(error);
      return;
    } else {
      setError("");
    }

    try {
      await mutateAsync({
        set_id,
        difficulty,
        questionType,
        questionText,
        choices,
        correctAnswer,
        explanation,
      });
    } catch (err) {
      setError("Failed to create question. Please try again.");
      console.error(err);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Content width="600px">
        <Flex direction="column" gap="3">
          <Heading size="5">Create New Question</Heading>
          <QuestionChoiceRadioGroup />
          {inputs}
          <DifficultyRadioGroup />
          <Flex justify="end" gap="2" mt="3">
            <Text color="red">{error}</Text>
            <Button
              radius="large"
              variant="soft"
              onClick={handleCreateQuestion}
            >
              Create Question
            </Button>
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}

export default CreateNewQuestionPopover;
