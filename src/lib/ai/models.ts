export interface ModelConfig {
  id: string;
  name: string;
  badge: string;
  description: string;
  ollamaModel: string;
  openAiModel?: string;
  maxTokens: number;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "genz-fast",
    name: "GENZ Fast",
    badge: "Lightning",
    description: "Fast, responsive responses powered by local Gemma 3.",
    ollamaModel: "gemma3:4b",
    openAiModel: "gemma3:4b",
    maxTokens: 4096,
  },
  {
    id: "genz-reasoning",
    name: "GENZ Reasoning",
    badge: "Deep Think",
    description: "Complex logic, deep code analysis, and architectural reasoning.",
    ollamaModel: "gemma3:4b",
    openAiModel: "gemma3:4b",
    maxTokens: 8192,
  },
  {
    id: "genz-creative",
    name: "GENZ Creative",
    badge: "Creative",
    description: "Expansive brainstorming, engaging writing, and design synthesis.",
    ollamaModel: "gemma3:4b",
    openAiModel: "gemma3:4b",
    maxTokens: 4096,
  },
];

export const DEFAULT_MODEL_ID = "genz-fast";

export function getModelConfig(modelId?: string): ModelConfig {
  const found = AVAILABLE_MODELS.find(
    (m) => m.id === modelId || m.ollamaModel === modelId
  );
  return (
    found || {
      id: modelId || "genz-fast",
      name: modelId || "GENZ Fast (Gemma 3)",
      badge: "Local",
      description: "Local Ollama model",
      ollamaModel: modelId || "gemma3:4b",
      openAiModel: modelId || "gemma3:4b",
      maxTokens: 4096,
    }
  );
}
