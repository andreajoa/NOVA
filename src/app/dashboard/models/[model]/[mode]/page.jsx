"use client";

import { useParams } from "next/navigation";
import NovaGenerationStudio from "@/components/NovaGenerationStudio";
import NovaFreeVideoStudio from "@/components/NovaFreeVideoStudio";
import NovaSpeechVideoStudio from "@/components/NovaSpeechVideoStudio";

export default function ModelModePage() {
  const { model, mode } = useParams();

  if (model === "nova-video-free") {
    if (mode === "speech-to-video") {
      return <NovaSpeechVideoStudio />;
    }
    return <NovaFreeVideoStudio initialModeKey={mode} />;
  }

  return (
    <NovaGenerationStudio
      initialModelKey={model}
      initialModeKey={mode}
      syncRoute
    />
  );
}
