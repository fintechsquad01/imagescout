
import { Instagram, ShoppingBag, FileText, Sparkles, Presentation, Video } from "lucide-react";

export interface ContentIntent {
  id: string;
  label: string;
  description: string;
  icon: typeof Instagram;
  promptModifier: string;
}

export const contentIntents: ContentIntent[] = [
  {
    id: "auto",
    label: "Let AI decide",
    description: "AI will determine the best content type based on the image",
    icon: Sparkles,
    promptModifier: ""
  },
  {
    id: "social",
    label: "Social Media Post",
    description: "Engaging content for Instagram, Facebook, or Twitter",
    icon: Instagram,
    promptModifier: "Create social media post content that is engaging and shareable. Focus on driving engagement with a conversational tone."
  },
  {
    id: "product",
    label: "Product Description",
    description: "Detailed description highlighting features and benefits",
    icon: ShoppingBag,
    promptModifier: "Write a compelling product description that highlights key features and benefits. Focus on value proposition and unique selling points."
  },
  {
    id: "blog",
    label: "Blog Article",
    description: "In-depth content for a blog post or article",
    icon: FileText,
    promptModifier: "Draft content for a blog article that explores the subject in depth. Include informative details and maintain an authoritative tone."
  },
  {
    id: "presentation",
    label: "Presentation",
    description: "Content suitable for slides or presentations",
    icon: Presentation,
    promptModifier: "Create concise content suitable for presentation slides. Focus on key points that can be presented visually with supporting text."
  },
  {
    id: "video",
    label: "Video Script",
    description: "Script outline for video content",
    icon: Video,
    promptModifier: "Draft a video script outline with narrative flow. Include scene descriptions and dialog suggestions that will engage viewers."
  }
];

export const getContentIntent = (intentId: string): ContentIntent => {
  return contentIntents.find(intent => intent.id === intentId) || contentIntents[0];
};
