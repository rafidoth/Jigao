import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ExamPageEndedUIProps = {
  endTime: Date;
  title: string;
};

function ExamPageEndedUI({ endTime, title }: ExamPageEndedUIProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{title || "Exam ended"}</CardTitle>
        <CardDescription>Ended at: {endTime.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">You may close this window.</p>
      </CardContent>
    </Card>
  );
}

export default ExamPageEndedUI;
