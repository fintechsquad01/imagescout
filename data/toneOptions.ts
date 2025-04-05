
export interface ToneOption {
  id: string;
  name: string;
  description: string;
  promptPrefix: string;
  emoji?: string;
}

// Available tone options
export const toneOptions: ToneOption[] = [
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Emotional, narrative-driven style",
    promptPrefix: "Create an emotional, story-driven scene with",
    emoji: "📖"
  },
  {
    id: "product",
    name: "Product",
    description: "Clean, commercial product focus",
    promptPrefix: "Design a clean, commercial-style product image featuring",
    emoji: "✨"
  },
  {
    id: "professional",
    name: "Professional",
    description: "Corporate, polished aesthetic",
    promptPrefix: "Generate a professional, polished corporate image of",
    emoji: "👔"
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Movie-like, dramatic visuals",
    promptPrefix: "Create a cinematic, dramatic scene showing",
    emoji: "🎬"
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple, clean, modern style",
    promptPrefix: "Design a minimalist, clean representation of",
    emoji: "◻️"
  }
];
