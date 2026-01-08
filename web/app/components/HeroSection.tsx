import { Clock } from "lucide-react";
import Image from "next/image";
import { Bevan } from "next/font/google";
import HoverButtonUI from "./HoverButtonUI";
const bevan = Bevan({ subsets: ["latin"], weight: "400" });

function HeroSection() {
  return (
    <section className="w-full p-4 flex justify-center items-center ">
      <div className="w-full h-full flex flex-col items-center rounded-[48px] bg-gradient-to-b from-slate-950  to-white">
        <Navbar />
        <div className="flex justify-center my-10">
          <span className=" rounded-full px-4 py-1 bg-white ">AI Powered</span>
        </div>
        <h1
          className={`text-white flex flex-wrap justify-center items-center text-5xl md:text-8xl text-center  px-4  font-bold ${bevan.className}`}
        >
          <span className="relative">
            Turn Notes into <br></br>
            Practice Exams
            <Clock
              className="text-white mx-auto mt-10 absolute bottom-8 -right-10 animate-spin"
              size={48}
            />
          </span>
        </h1>
        <p
          className={` w-[600px] text-center text-white mt-6 text-lg md:text-xl my-15`}
        >
          Upload your <strong>notes (text or PDF)</strong> to instantly generate{" "}
          <strong>practice exams</strong>, attempt them, and receive{" "}
          <strong>immediate feedback</strong> to accelerate learning.
        </p>
        <HoverButtonUI />

        <Image
          className="object-cover my-20"
          src="/heross.png"
          alt="Jigao Product Photo"
          width={1280}
          height={500}
        />
      </div>
    </section>
  );
}

function Navbar() {
  return (
    <nav className="text-white md:w-[1200px] p-4 h-[60px] flex justify-center items-center md:mb-10 md:mt-10 ">
      <div className="flex gap-x-2">
        <Image
          src="/logo.png"
          alt="Jigao Logo"
          width={32}
          height={32}
          className="mr-auto"
        />
      </div>
    </nav>
  );
}
export default HeroSection;
