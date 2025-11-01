import {
  Popover,
  Flex,
  Heading,
  TextField,
  Text,
  RadioCards,
  Box,
  Button,
} from "@radix-ui/themes";
import { useState } from "react";
import { GlobeIcon, LockClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function updateSetSettings(variables) {
  const { set_id, title, visibility } = variables;
  const body = {
    title: title,
    visibility: visibility,
  };
  const res = await axios.put(
    `http://localhost:9999/api/v1/sets/${set_id}`,
    body,
  );
  return res.data;
}

function SetSettingsUpdatePopover({ set, children }) {
  const [title, setTitle] = useState(set.title);
  const visibilityList = ["public", "private", "restricted"];
  const [currentVisibility, setCurrentVisibility] = useState(set.visibility);
  const [error, setError] = useState("");

  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: updateSetSettings,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["set", variables.set_id] });
      setError("");
      console.log("Set Settings created successfully");
    },
    onError: (error) => {
      console.log("Error creating question:", error);
      setError("Failed to update set. Please try again.");
    },
  });
  const handleApply = async () => {
    try {
      await mutateAsync({
        set_id: set.id,
        title,
        visibility: currentVisibility,
      });
    } catch (error) {
      console.log("Error updating set :", error);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Content width="600px">
        <Flex direction="column" gap="3">
          <Heading size="5">Set Settings</Heading>
          <Text>Title</Text>
          <TextField.Root
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          ></TextField.Root>
          <Text>Visibility</Text>
          <VisibilityList
            currentVisibility={currentVisibility}
            setCurrentVisibility={setCurrentVisibility}
            visibilityList={visibilityList}
          />
        </Flex>
        {error && <Text color="red">{error.message}</Text>}
        <Flex justify={"end"} mt={"3"}>
          <Button
            disabled={
              !title ||
              !currentVisibility ||
              title === "" ||
              (title === set.title && currentVisibility === set.visibility)
            }
            onClick={handleApply}
          >
            Apply
          </Button>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
export default SetSettingsUpdatePopover;

function VisibilityList({
  currentVisibility,
  setCurrentVisibility,
  visibilityList,
}) {
  return (
    <Box width={"100%"}>
      <RadioCards.Root
        defaultValue={currentVisibility}
        value={currentVisibility}
        onValueChange={setCurrentVisibility}
      >
        <Flex width={"100%"} justify={"between"}>
          {visibilityList.map((v) => (
            <RadioCards.Item value={v} key={v} style={{ width: "30%" }}>
              <Flex direction={"column"} align={"center"} gap="2">
                <Text>{v}</Text>
                {getVisibilityIcon(v)}
              </Flex>
            </RadioCards.Item>
          ))}
        </Flex>
      </RadioCards.Root>
    </Box>
  );
}

const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case "public":
      return <GlobeIcon style={{ height: "24px", width: "24px" }} />;
    case "private":
      return <LockClosedIcon style={{ height: "24px", width: "24px" }} />;
    case "restricted":
      return <EyeOpenIcon style={{ height: "24px", width: "24px" }} />;
  }
};
