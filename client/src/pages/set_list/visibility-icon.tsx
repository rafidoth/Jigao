import {
  Globe2 as GlobeIcon,
  Lock as LockClosedIcon,
  Eye as EyeOpenIcon,
} from "lucide-react";

export function VisibilityIcon({ visibility }: { visibility: string }) {
  switch (visibility) {
    case "public":
      return <GlobeIcon className="h-5 w-5 text-muted-foreground" />;
    case "private":
      return <LockClosedIcon className="h-5 w-5 text-muted-foreground" />;
    case "restricted":
      return <EyeOpenIcon className="h-5 w-5 text-muted-foreground" />;
    default:
      return null;
  }
}
