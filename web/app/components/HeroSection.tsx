import { Clock } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function HeroSection() {
  return (
    <section className="w-full p-4 flex justify-center items-center ">
      <div className="w-full h-full flex flex-col items-center rounded-[48px] bg-gradient-to-b from-slate-950  to-white">
        <Navbar />
        <div className="flex justify-center mt-10">
          <span className="text-white rounded-full border px-4 py-1 opacity-60">
            AI Powered
          </span>
        </div>
        <h1
          className={`text-white flex flex-wrap justify-center items-center text-5xl md:text-7xl text-center  px-4  font-bold `}
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
          className={` w-[600px] text-center text-white mt-6 text-lg md:text-2xl`}
        >
          Upload your <strong>notes (text or PDF)</strong> to instantly generate{" "}
          <strong>practice exams</strong>, attempt them, and receive{" "}
          <strong>immediate feedback</strong> to accelerate learning.
        </p>
        <div className="flex mt-8">
          <Input
            className="border-none bg-slate-900 text-white font-semibold placeholder:text-white/40 focus:ring-0 focus:border-none"
            placeholder="Enter your email"
            type="email"
          />
          <Button className="ml-4 cursor-pointer">Notify Me</Button>
        </div>

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
    <nav className="w-full p-4 h-[60px] flex justify-center items-center ">
      <ul className="flex space-x-4 ">
        <li className="hover:underline cursor-pointer">Home</li>
        <li className="hover:underline cursor-pointer">About</li>
        <li className="hover:underline cursor-pointer">Services</li>
        <li className="hover:underline cursor-pointer">Contact</li>
      </ul>
    </nav>
  );
}
export default HeroSection;
