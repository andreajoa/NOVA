"use client";

import { useParams } from "next/navigation";
import NovaGenerationStudio from "@/components/NovaGenerationStudio";

export default function ModelModePage() {
  const { model, mode } = useParams();

  return (
    <NovaGenerationStudio
      initialModelKey={model}
      initialModeKey={mode}
      syncRoute
    />
  );
}
