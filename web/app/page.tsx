import Image from "next/image";
import HeroSection from "./components/HeroSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
    </main>
  );
}

function HowItWorks() {
  return (
    <section className="flex flex-col gap-2 items-center">
      <div className="flex justify-between rounded-3xl items-center w-3/4">
        <Image
          className=" rounded-3xl scale-70"
          src="/generation.png"
          alt="Jigao Product Photo"
          width={604}
          height={476}
        />
        <div className="flex flex-col items-end">
          <h1 className="text-6xl font-bold text-right">
            Generate Questions <br></br> Based on your Notes{" "}
          </h1>
          <p className="mt-4 text-3xl w-3/4 text-right">
            Simply upload your notes in text or PDF format, and Jigao's AI will
            analyze the content to create relevant practice questions. This
            personalized approach helps you focus on areas that need
            improvement.
          </p>
        </div>
      </div>

      <div className="flex justify-between rounded-3xl items-center w-3/4">
        <div className="flex flex-col justify-start">
          <h1 className="text-6xl font-bold">
            Schedule Exams and <br></br>Make your Learning Consistent{" "}
          </h1>
          <p className="mt-4 text-3xl w-3/4">
            Consistency is key to mastering any subject. With{" "}
            <strong> Jigao</strong>, you can schedule regular practice exams
            based on your uploaded notes. This ensures that you stay engaged
            with the material and track your progress over time.
          </p>
        </div>
        <Image
          className=" rounded-3xl scale-70"
          src="/exam.png"
          alt="Jigao Product Photo"
          width={604}
          height={476}
        />
      </div>
      <div className="flex justify-between rounded-3xl items-center w-3/4">
        <Image
          className=" rounded-3xl scale-70"
          src="/generation.png"
          alt="Jigao Product Photo"
          width={604}
          height={476}
        />
        <div className="flex flex-col items-end">
          <h1 className="text-6xl font-bold text-right">
            Immediate Feedback <br></br> to Improve Learning{" "}
          </h1>
          <p className="mt-4 text-3xl w-3/4 text-right">
            After completing each practice exam, Jigao provides immediate
            feedback on your performance. You'll receive detailed results,
            highlighting your strengths and areas for improvement. This feedback
            loop allows you to adjust your study strategies and focus on topics
            that require more attention.
          </p>
        </div>
      </div>
    </section>
  );
}
