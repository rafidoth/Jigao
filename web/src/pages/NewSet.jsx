import { useState } from "react";
import { Flex, IconButton, Text, Select, Card } from "@radix-ui/themes";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import styles from "./NewSet.module.css";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

async function generateQuestionsApiPost(variables) {
  const { numQuestions, questionType, texualContext } = variables;
  const body = {
    n: numQuestions,
    type: questionType,
    context: texualContext,
  };
  const res = await axios.post("url", body);
  return res.data;
}

function NewSet() {
  const [selectedValue, setSelectedValue] = useState("5");
  const [selectedType, setSelectedType] = useState("MultipleChoice");
  const [message, setMessage] = useState("");

  const { mutateAsync } = useMutation({
    mutationFn: generateQuestionsApiPost,
    onSuccess: () => {
      console.log("Success");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleSend = async () => {
    try {
      await mutateAsync({
        numQuestions: parseInt(selectedValue),
        questionType: selectedType,
        texualContext: message,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex
      direction={"column"}
      width={"100%"}
      height={"100%"}
      align={"center"}
      justify={"center"}
    >
      <Card style={{ position: "relative", width: "fit-content" }}>
        <Flex gap="2" align="center">
          <Text as="span" color="teal">
            Generate{" "}
          </Text>
          <span style={{ display: "inline-flex", pointerEvents: "auto" }}>
            <Select.Root value={selectedValue} onValueChange={setSelectedValue}>
              <Select.Trigger variant="soft" />
              <Select.Content>
                <Select.Group>
                  {Array.from({ length: 6 }, (_, i) => (i + 1) * 5).map(
                    (value) => (
                      <Select.Item key={value} value={value.toString()}>
                        {value}
                      </Select.Item>
                    ),
                  )}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </span>

          <span style={{ display: "inline-flex", pointerEvents: "auto" }}>
            <Select.Root value={selectedType} onValueChange={setSelectedType}>
              <Select.Trigger variant="soft" />
              <Select.Content>
                <Select.Group>
                  {[
                    "Multiple Choice",
                    "True/False",
                    "Short Answer",
                    "Fill in the Blank",
                    "Mixed Type",
                  ].map((value) => (
                    <Select.Item key={value} value={value.replace(/\s/g, "")}>
                      {value}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </span>
          <Text as="span" color="teal">
            {" "}
            questions on{" "}
          </Text>
        </Flex>
        <textarea
          className={
            message.length <= 200 ? styles.ChatInput : styles.ChatInputExtended
          }
          size="3"
          placeholder="Paste your Text Context here or just mention a topic name"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <IconButton
          size="3"
          variant="soft"
          radius="full"
          onClick={handleSend}
          style={{ position: "absolute", right: 8, bottom: 8 }}
          type="button"
          aria-label="Send"
        >
          <PaperPlaneIcon style={{ width: "20px", height: "20px" }} />
        </IconButton>
      </Card>
      <Text color="gray" mt={"3"}>
        AI will generate a set of questions based on your context.
      </Text>
    </Flex>
  );
}

export default NewSet;
