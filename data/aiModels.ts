
import { AIModel } from '@/types/content';

export const availableModels: AIModel[] = [
  {
    id: 'gpt-4-vision',
    name: 'GPT-4 Vision',
    description: 'Best for detailed image analysis and creative content',
    icon: 'sparkles',
    suitableFor: ['Creative content', 'Detailed descriptions', 'Marketing copy'],
    explanation: 'The most advanced model with excellent vision capabilities',
    provider: 'OpenAI',
    available: true
  },
  {
    id: 'claude-3-vision',
    name: 'Claude 3 Vision',
    description: 'Great for nuanced understanding of images',
    icon: 'eye',
    suitableFor: ['Nuanced content', 'Brand voice', 'Detailed analysis'],
    explanation: 'Excellent at understanding context and producing high-quality content',
    provider: 'Anthropic',
    available: true
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    description: 'Balanced model with strong technical understanding',
    icon: 'star',
    suitableFor: ['Technical content', 'Specifications', 'Feature descriptions'],
    explanation: 'Great at understanding technical aspects of images',
    provider: 'Google',
    available: true
  }
];

// Re-export the AIModel type for backwards compatibility
export type { AIModel } from '@/types/content';
