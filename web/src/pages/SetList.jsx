import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Card, Text, Flex, Grid, IconButton } from "@radix-ui/themes";
import { GlobeIcon, LockClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { Link } from "react-router";
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

const getRecentSets = async () => {
  const res = await axios.get("http://localhost:9999/api/v1/sets?recent=10");
  return res.data;
};

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

const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case "public":
      return <GlobeIcon />;
    case "private":
      return <LockClosedIcon />;
    case "restricted":
      return <EyeOpenIcon />;
  }
};

function SetList() {
  const {
    data: sets,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["sets"], queryFn: getRecentSets });
  console.log(sets);

  if (isLoading) return <Text>Loading...</Text>;
  if (isError) return <Text>Error loading sets</Text>;

  return (
    <Flex direction="column" gap="4" p="9">
      <Text size="7" weight="bold">
        Recent Sets
      </Text>
      <Flex gap="5" wrap="wrap">
        {sets?.map((set) => (
          <Link
            key={set.id}
            to={`/sets/${set.id}`}
            style={{ textDecoration: "none" }}
          >
            <Card>
              <Flex direction="column" gap="2" width="400px" p="4">
                <Flex direction="column">
                  <Flex align="center" gap="2">
                    <Text size="6" weight="medium" color="teal">
                      {set.title}
                    </Text>
                    <IconButton variant="ghost">
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
