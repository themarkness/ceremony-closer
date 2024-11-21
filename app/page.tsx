"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import DropDown, { VibeType } from "../components/DropDown";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LoadingDots from "../components/LoadingDots";
import Toggle from "../components/Toggle";
import { ChatCompletionStream } from "together-ai/lib/ChatCompletionStream";

type Ceremony = 'standup' | 'retrospective';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState("");
  const [vibe, setVibe] = useState<VibeType>("Professional");
  const [generatedBios, setGeneratedBios] = useState<String>("");
  const [isLlama, setIsLlama] = useState(false);
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null);

  const bioRef = useRef<null | HTMLDivElement>(null);

  const scrollToBios = () => {
    if (bioRef.current !== null) {
      bioRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const prompt = `Generate a motivational ${
    selectedCeremony === 'standup' 
      ? 'daily standup closing phrase that energizes the team for the day ahead' 
      : 'retrospective closing phrase that celebrates the team\'s achievements and learning'
  }. The phrase should be ${vibe} in tone. 
  ${
    selectedCeremony === 'standup' 
      ? 'Focus on productivity, collaboration, and daily goals.' 
      : 'Focus on reflection, improvement, and team accomplishments.'
  }`;

  const generateBio = async (e: any) => {
    e.preventDefault();
    setGeneratedBios("");
    setLoading(true);

    try {
      const response = await fetch("/api/together", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ceremony: selectedCeremony,
          vibe: vibe,
          model: isLlama
            ? "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
            : "mistralai/Mixtral-8x7B-Instruct-v0.1",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate phrase");
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const runner = ChatCompletionStream.fromReadableStream(response.body);
      runner.on("content", (delta) => setGeneratedBios((prev) => prev + delta));

      scrollToBios();
    } catch (error) {
      console.error("Error generating phrase:", error);
      setGeneratedBios("An error occurred while generating the phrase. Please try again.");
      toast.error("Failed to generate phrase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mt-20">
        <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900">
          Generate your ceremony closing phrase
        </h1>
        <div className="mt-7">
          <Toggle isGPT={isLlama} setIsGPT={setIsLlama} />
        </div>

        <div className="max-w-xl w-full">
          <div className="flex mt-10 items-center space-x-3">
            <Image
              src="/1-black.png"
              width={30}
              height={30}
              alt="1 icon"
              className="mb-5 sm:mb-0"
            />
            <p className="text-left font-medium">
              Select the ceremony you wish to close
            </p>
          </div>
          
          <div className="button-group">
            <button
              className={`ceremony-button ${selectedCeremony === 'standup' ? 'selected' : ''}`}
              onClick={() => setSelectedCeremony('standup')}
            >
              Daily Standup
            </button>
            <button
              className={`ceremony-button ${selectedCeremony === 'retrospective' ? 'selected' : ''}`}
              onClick={() => setSelectedCeremony('retrospective')}
            >
              Retrospective
            </button>
          </div>

          <div className="flex mb-5 items-center space-x-3">
            <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
            <p className="text-left font-medium">Select your vibe.</p>
          </div>
          <div className="block">
            <DropDown vibe={vibe} setVibe={(newVibe) => setVibe(newVibe)} />
          </div>

          {loading ? (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              disabled
            >
              <LoadingDots color="white" style="large" />
            </button>
          ) : (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              onClick={(e) => generateBio(e)}
              disabled={!selectedCeremony}
            >
              Let's close this ceremony &rarr;
            </button>
          )}
        </div>

        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
        <div className="space-y-10 my-10">
          {generatedBios && (
            <>
              <div>
                <h2
                  className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto"
                  ref={bioRef}
                >
                  Your closing phrase
                </h2>
              </div>
              <div className="space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto">
                <div
                  className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedBios);
                    toast("Phrase copied to clipboard", {
                      icon: "✂️",
                    });
                  }}
                >
                  <p>{generatedBios}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
