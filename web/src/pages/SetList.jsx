import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Text, Flex, Grid, Button, IconButton } from "@radix-ui/themes";
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
  const res = await axios.get("http://localhost:9999/api/v1/sets?recent=10");
  return res.data;
};

const createNewSetPost = async () => {
  const res = await axios.post("http://localhost:9999/api/v1/sets");
  return res.data;
};

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
    <Flex justify={"center"} direction="column" gap="4" p="9">
      <Flex gap="2" direction="column">
        <Text size="7" weight="bold">
          Sets
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
      <Flex gap="5" wrap="wrap">
        {sets?.map((set) => (
          <Link
            key={set.id}
            to={`/sets/${set.id}`}
            style={{ textDecoration: "none" }}
          >
            <Card>
              <Flex
                direction="column"
                gap="2"
                width="400px"
                p="4"
                height="100px"
              >
                <Flex direction="column">
                  <Flex align="center" gap="2">
                    <Text size="6" weight="medium" color="teal">
                      {set.title}
                    </Text>
                    <IconButton variant="ghost" color="gray">
                      {getVisibilityIcon(set.visibility)}
                    </IconButton>
                  </Flex>
                  <Text size="2" color="gray">
                    Last modified {lastModified(set.updated_at)}
                  </Text>
                </Flex>
              </Flex>
            </Card>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}

export default SetList;
