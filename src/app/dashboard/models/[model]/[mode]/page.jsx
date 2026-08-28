"use client";

import { useParams } from "next/navigation";
import NovaGenerationStudio from "@/components/NovaGenerationStudio";
import NovaFreeVideoStudio from "@/components/NovaFreeVideoStudio";

export default function ModelModePage() {
  const { model, mode } = useParams();

  if (model === "nova-video-free") {
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
