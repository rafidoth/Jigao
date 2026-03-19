import { useUser } from "@clerk/clerk-react";

function Preview() {
  const user = useUser();
  return (
    <div>
      <strong>Hi, {user.user?.firstName}, </strong>
    </div>
  );
}
export default Preview;
