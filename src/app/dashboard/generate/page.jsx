"use client";
import { useRouter } from "next/navigation";
export default function GeneratePage() {
  const router = useRouter();
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-black uppercase tracking-[-0.05em] mb-6">Generate</h1>
      <p className="text-white/40 mb-8">Choose a model to start generating.</p>
      <button onClick={() => router.push("/dashboard/models")}
        className="bg-[#D7FF00] text-black font-black uppercase text-sm tracking-wider px-8 py-3 rounded-xl">
        Browse Models →
      </button>
    </div>
  );
}
