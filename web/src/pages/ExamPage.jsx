import { useParams } from "react-router";
function ExamPage() {
  // extract exam id from url params

  const { exam_id } = useParams();

  return <div>Exam Page for {exam_id}</div>;
}

export default ExamPage;
