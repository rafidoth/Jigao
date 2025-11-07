import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScrollArea, Card, Text, Flex, Box, Button } from "@radix-ui/themes";
import {
  PlusIcon,
  GlobeIcon,
  LockClosedIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";
import { Link, useNavigate } from "react-router";
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { rootDomain } from "../api/api";

const lastModified = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours} hours ago`;
  const days = differenceInDays(now, date);
  if (days < 7) return `${days} days ago`;
  const weeks = differenceInWeeks(now, date);
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = differenceInMonths(now, date);
  if (months < 12) return `${months} months ago`;
  const years = differenceInYears(now, date);
  return `${years} years ago`;
};

const getRecentSets = async () => {
  const res = await axios.get(`${rootDomain}/api/v1/sets?recent=10`);
  return res.data;
};

const createNewSetPost = async () => {
  const res = await axios.post(`${rootDomain}/api/v1/sets`);
  return res.data;
};

const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case "public":
      return <GlobeIcon style={{ height: "20px", width: "20px" }} />;
    case "private":
      return <LockClosedIcon style={{ height: "20px", width: "20px" }} />;
    case "restricted":
      return <EyeOpenIcon style={{ height: "20px", width: "20px" }} />;
  }
};

function SetList() {
  const {
    data: sets,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["sets"], queryFn: getRecentSets });

  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: createNewSetPost,
    onSuccess: (data) => {
      console.log("Set Settings created successfully");
      if (data.id) {
        navigate(`/sets/${data.id}`);
      }
    },
    onError: (error) => {
      console.log("Error creating question:", error);
    },
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (isError) return <Text>Error loading sets</Text>;

  const handleCreateNewSet = async () => {
    try {
      await mutateAsync();
    } catch (error) {
      console.log("Error creating set:", error);
    }
  };

  return (
    <Flex
      justify={"center"}
      direction="column"
      gap="4"
      p={{
        initial: "3",
        lg: "9",
      }}
    >
      <Flex
        gap="2"
        direction={{ initial: "row", md: "column" }}
        justify={{ initial: "between", md: "start" }}
      >
        <Text size="7" weight="bold">
          My Sets
        </Text>
        <Button
          variant="soft"
          style={{ width: "100px", cursor: "pointer" }}
          onClick={handleCreateNewSet}
        >
          <Flex align="center" gap="2">
            <PlusIcon style={{ width: "24px", height: "24px" }} />
            <Text size={"3"}>New</Text>
          </Flex>
        </Button>
      </Flex>
      <ScrollArea
        type="scroll"
        style={{ height: "calc(100vh - 100px)" }}
        scrollbars="vertical"
      >
        <Flex direction={{ initial: "column", md: "row" }} gap="5" wrap="wrap">
          {sets?.map((set) => (
            <Card asChild variant="interactive">
              <Link
                key={set.id}
                to={`/sets/${set.id}`}
                style={{ textDecoration: "none" }}
              >
                <Flex direction="column" gap="2" width={{ md: "400px" }} p="4">
                  <Text
                    size={{ initial: "5", md: "6" }}
                    weight="medium"
                    style={{ color: "white" }}
                  >
                    {set.title}
                  </Text>
                  <Flex direction="column" width={"100%"}>
                    <Flex align="center" gap="2">
                      <Box asChild color="GrayText">
                        {getVisibilityIcon(set.visibility)}
                      </Box>
                      <Text size="4" color="gray">
                        Last modified {lastModified(set.updated_at)}
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Link>
            </Card>
          ))}
        </Flex>
      </ScrollArea>
    </Flex>
  );
}

export default SetList;
